import { constants, CallData, Result } from 'starknet';
import { getProvider, parseStarknetAddress, getContract } from './clients.js';
import { utils as helpers } from './utils.js';

/**
 * Represents a Starknet profile with all its data
 */
export interface StarkProfile {
  id?: bigint;
  starknetId?: string;
  address: string;
  profilePicture?: string;
  verifications?: Record<string, boolean>;
  proofOfPersonhood?: boolean;
}

// Contract addresses for Starknet ID
type NetworkAddresses = {
  [key: string]: string;
};

const STARKNET_ID_CONTRACTS: {
  naming: NetworkAddresses;
  identity: NetworkAddresses;
} = {
  naming: {
    mainnet: '0x6ac597f8116f886fa1c97a23fa4e08299975ecaf6b598873ca6792b9bbfb678',
    sepolia: '0x0754de667b8dd15907e78dc5578c463acd0fb804bd1f9456fc33b1b5e30902dc'
  },
  identity: {
    mainnet: '0x05dbdedc203e92749e2e746e2d40a768d966bd243df04a6b712e222bc040a9af',
    sepolia: '0x0798e884450c19e072d6620fefdbeb7387d0453d3fd51d95f5ace1f17633d88b'
  }
};

/**
 * Get the Starknet ID for a given address
 * @param address The Starknet address to lookup
 * @param network Network name (mainnet, sepolia)
 * @returns The Starknet ID or empty string if not found
 */
export async function getStarkName(
  address: string,
  network = 'mainnet'
): Promise<string> {
  try {
    const provider = getProvider(network);
    const formattedAddress = parseStarknetAddress(address);
    
    // Get the naming contract for the specified network
    const contractAddress = STARKNET_ID_CONTRACTS.naming[network as keyof typeof STARKNET_ID_CONTRACTS.naming] || STARKNET_ID_CONTRACTS.naming.mainnet;
    const contract = getContract(contractAddress, provider, network);
    
    // Get the class hash to fetch the ABI
    const classHash = await provider.getClassHashAt(contract.address, 'latest');
    const contractClass = await provider.getClass(classHash, 'latest');
    
    // Attach the ABI
    contract.attachABI(contractClass.abi);
    
    // Call the getStarkName function - this would be the actual implementation
    // Simplified implementation that might need adjustment based on the actual contract
    const starkNetIdResponse = await contract.call('starknet_id_of', [formattedAddress]);
    
    if (!starkNetIdResponse || starkNetIdResponse.toString() === '0') {
      return '';
    }
    
    // Convert numeric StarknetID to a domain string
    const starkName = await decodeDomain(starkNetIdResponse.toString(), network);
    return starkName ? `${starkName}.stark` : '';
  } catch (error) {
    console.error('Error getting Starknet ID:', error);
    return '';
  }
}

/**
 * Get the address for a given Starknet ID
 * @param name The Starknet ID to lookup
 * @param network Network name (mainnet, sepolia)
 * @returns The Starknet address or empty string if not found
 */
export async function getAddressFromStarkName(
  name: string,
  network = 'mainnet'
): Promise<string> {
  try {
    const provider = getProvider(network);
    
    // Remove .stark suffix if present
    const baseDomain = name.endsWith('.stark') ? name.slice(0, -6) : name;
    
    // Encode the domain name
    const encodedDomain = await encodeDomain(baseDomain);
    
    // Get the naming contract for the specified network
    const contractAddress = STARKNET_ID_CONTRACTS.naming[network as keyof typeof STARKNET_ID_CONTRACTS.naming] || STARKNET_ID_CONTRACTS.naming.mainnet;
    const contract = getContract(contractAddress, provider, network);
    
    // Get the class hash to fetch the ABI
    const classHash = await provider.getClassHashAt(contract.address, 'latest');
    const contractClass = await provider.getClass(classHash, 'latest');
    
    // Attach the ABI
    contract.attachABI(contractClass.abi);
    
    // Call the function to get the owner of the Starknet ID
    const addressResponse = await contract.call('owner_of', [encodedDomain.toString()]);
    
    if (!addressResponse || addressResponse.toString() === '0') {
      return '';
    }
    
    // Format the address
    return helpers.formatAddress(addressResponse.toString());
  } catch (error) {
    console.error('Error getting address from Starknet ID:', error);
    return '';
  }
}

/**
 * Get detailed profile information for a Starknet address
 * @param address The Starknet address to lookup
 * @param network Network name (mainnet, sepolia)
 * @returns The Starknet profile data or null if not found
 */
export async function getStarkProfile(
  address: string,
  network = 'mainnet'
): Promise<StarkProfile | null> {
  try {
    const provider = getProvider(network);
    const formattedAddress = parseStarknetAddress(address);
    
    // Get the Starknet ID first
    const starknetId = await getStarkName(address, network);
    if (!starknetId) {
      return null;
    }
    
    // Get the identity contract
    const identityContractAddress = STARKNET_ID_CONTRACTS.identity[network as keyof typeof STARKNET_ID_CONTRACTS.identity] || STARKNET_ID_CONTRACTS.identity.mainnet;
    const identityContract = getContract(identityContractAddress, provider, network);
    
    // Get the class hash to fetch the ABI
    const classHash = await provider.getClassHashAt(identityContract.address, 'latest');
    const contractClass = await provider.getClass(classHash, 'latest');
    
    // Attach the ABI
    identityContract.attachABI(contractClass.abi);
    
    // Remove .stark suffix
    const baseDomain = starknetId.endsWith('.stark') ? starknetId.slice(0, -6) : starknetId;
    
    // Encode the domain name
    const encodedDomain = await encodeDomain(baseDomain);
    
    // Create a simple profile structure
    // In a real implementation, you would fetch more data from the identity contract
    const profilePictureResponse = await identityContract.call('get_profile_picture', [encodedDomain.toString()]);
    
    return {
      id: BigInt(encodedDomain.toString()),
      starknetId,
      address: formattedAddress,
      profilePicture: profilePictureResponse.toString() !== '0' ? profilePictureResponse.toString() : undefined,
      verifications: {}, // Would come from contract calls in a real implementation
      proofOfPersonhood: false, // Would come from contract calls in a real implementation
    };
  } catch (error) {
    console.error('Error getting Starknet profile:', error);
    return null;
  }
}

/**
 * Check if a string is a valid Starknet domain
 * @param domain The domain to check (with or without .stark)
 * @returns True if it's a valid Starknet domain
 */
export function isValidStarknetDomain(domain: string): boolean {
  // Remove .stark suffix if present
  const baseDomain = domain.endsWith('.stark') 
    ? domain.slice(0, -6) 
    : domain;
  
  // Check if domain contains only allowed characters (a-z, 0-9, -)
  const validDomainRegex = /^[a-z0-9-]+$/;
  
  // Check length constraints
  return (
    validDomainRegex.test(baseDomain) && 
    baseDomain.length >= 1 &&
    baseDomain.length <= 31
  );
}

/**
 * Encode a Starknet domain name
 * @param domain The domain name (without .stark)
 * @returns The encoded domain as a BigInt
 */
export async function encodeDomain(domain: string): Promise<bigint> {
  try {
    // Convert domain to lowercase
    const lowercaseDomain = domain.toLowerCase();
    
    // Split domain into parts (if there are dots)
    const parts = lowercaseDomain.split('.');
    
    // Simple encoding logic (This is a simplified version for demonstration)
    // A real implementation would use Starknet-specific encoding
    const encoded = BigInt('0x' + Buffer.from(lowercaseDomain).toString('hex'));
    
    return encoded;
  } catch (error) {
    console.error('Error encoding domain:', error);
    return BigInt(0);
  }
}

/**
 * Decode a Starknet domain ID to a readable name
 * @param domainId The domain ID (encoded)
 * @param network Network name (mainnet, sepolia)
 * @returns The decoded domain name or null if not found
 */
export async function decodeDomain(domainId: string, network = 'mainnet'): Promise<string | null> {
  try {
    const provider = getProvider(network);
    
    // Get the naming contract
    const contractAddress = STARKNET_ID_CONTRACTS.naming[network as keyof typeof STARKNET_ID_CONTRACTS.naming] || STARKNET_ID_CONTRACTS.naming.mainnet;
    const contract = getContract(contractAddress, provider, network);
    
    // Get the class hash to fetch the ABI
    const classHash = await provider.getClassHashAt(contract.address, 'latest');
    const contractClass = await provider.getClass(classHash, 'latest');
    
    // Attach the ABI
    contract.attachABI(contractClass.abi);
    
    // Call the function to get the domain string
    // Note: The actual function name and parameters would depend on the contract
    const domainResponse = await contract.call('domain_to_string', [domainId]);
    
    // Handle the response based on its type
    if (!domainResponse) {
      return null;
    }
    
    // Convert the response to a string
    // Check if it's an array-like response
    if (Array.isArray(domainResponse)) {
      let domainString = '';
      
      for (let i = 0; i < domainResponse.length; i++) {
        const part = domainResponse[i];
        
        if (typeof part === 'bigint') {
          // Try to convert to a string if it's a felt representing characters
          domainString += helpers.feltToString(helpers.toFelt(part));
        } else {
          domainString += part.toString();
        }
      }
      
      return domainString;
    } else {
      // If it's not an array, just return the string representation
      return domainResponse.toString();
    }
  } catch (error) {
    console.error('Error decoding domain:', error);
    return null;
  }
}

/**
 * Get the Starknet ID contract address based on network
 * @param network Network name (mainnet, sepolia)
 * @returns Contract address
 */
export function getStarknetIdContract(network = 'mainnet'): string {
  return STARKNET_ID_CONTRACTS.naming[network as keyof typeof STARKNET_ID_CONTRACTS.naming] || STARKNET_ID_CONTRACTS.naming.mainnet;
}

/**
 * Get the Starknet ID identity contract address based on network
 * @param network Network name (mainnet, sepolia)
 * @returns Contract address
 */
export function getStarknetIdIdentityContract(network = 'mainnet'): string {
  return STARKNET_ID_CONTRACTS.identity[network as keyof typeof STARKNET_ID_CONTRACTS.identity] || STARKNET_ID_CONTRACTS.identity.mainnet;
} 