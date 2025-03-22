import { constants } from 'starknet';
import { StarknetIdNavigator, type StarkProfile as StarknetIdProfile, utils as starknetIdUtils } from 'starknetid.js';
import { getProvider } from './clients.js';

/**
 * Represents a Starknet profile with all its data
 */
export interface StarkProfile {
  id?: bigint;
  starknetId?: string;
  address: string;
  profilePicture?: string;
  verifications?: {
    twitter?: string;
    github?: string;
    discord?: string;
    [key: string]: string | undefined;
  };
  proofOfPersonhood?: boolean;
}

// Map of network names to chain IDs for cleaner code
const CHAIN_IDS = {
  mainnet: constants.StarknetChainId.SN_MAIN,
  sepolia: constants.StarknetChainId.SN_SEPOLIA
};

// Cache for StarknetIdNavigator instances to avoid recreating them for each request
const navigatorCache = new Map<string, StarknetIdNavigator>();

/**
 * Get a StarknetIdNavigator instance for a specific network
 * @param network Network name (mainnet, sepolia)
 * @returns StarknetIdNavigator instance
 */
function getStarknetIdNavigator(network = 'mainnet'): StarknetIdNavigator {
  const cacheKey = network;
  
  // Return cached navigator if available
  if (navigatorCache.has(cacheKey)) {
    return navigatorCache.get(cacheKey)!;
  }
  
  const provider = getProvider(network);
  const chainId = CHAIN_IDS[network as keyof typeof CHAIN_IDS] || CHAIN_IDS.mainnet;
  
  const navigator = new StarknetIdNavigator(provider, chainId);
  navigatorCache.set(cacheKey, navigator);
  
  return navigator;
}

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
    const navigator = getStarknetIdNavigator(network);
    return await navigator.getStarkName(address) || '';
  } catch (error) {
    console.error('Error getting Starknet ID:', error);
    return '';
  }
}

/**
 * Get multiple Starknet IDs for a list of addresses
 * @param addresses List of Starknet addresses to lookup
 * @param network Network name (mainnet, sepolia)
 * @returns Array of Starknet IDs (empty string for addresses without IDs)
 */
export async function getStarkNames(
  addresses: string[],
  network = 'mainnet'
): Promise<string[]> {
  try {
    const navigator = getStarknetIdNavigator(network);
    return await navigator.getStarkNames(addresses);
  } catch (error) {
    console.error('Error getting multiple Starknet IDs:', error);
    return addresses.map(() => '');
  }
}

/**
 * Get the address for a given Starknet ID
 * @param name The Starknet ID to lookup (with or without .stark)
 * @param network Network name (mainnet, sepolia)
 * @returns The Starknet address or empty string if not found
 */
export async function getAddressFromStarkName(
  name: string,
  network = 'mainnet'
): Promise<string> {
  try {
    // Make sure it has .stark suffix as required by StarknetID
    const fullName = name.endsWith('.stark') ? name : `${name}.stark`;
    
    const navigator = getStarknetIdNavigator(network);
    return await navigator.getAddressFromStarkName(fullName) || '';
  } catch (error) {
    console.error('Error getting address from Starknet ID:', error);
    return '';
  }
}

/**
 * Get the Starknet ID numeric identifier
 * @param domain The Starknet domain
 * @param network Network name (mainnet, sepolia)
 * @returns The Starknet ID numeric identifier
 */
export async function getStarknetId(
  domain: string,
  network = 'mainnet'
): Promise<string> {
  try {
    const navigator = getStarknetIdNavigator(network);
    return await navigator.getStarknetId(domain);
  } catch (error) {
    console.error('Error getting Starknet ID numeric identifier:', error);
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
    const navigator = getStarknetIdNavigator(network);
    const profileData = await navigator.getProfileData(address);
    
    if (!profileData) {
      return null;
    }
    
    // Convert from StarknetId's profile format to our format
    return {
      address,
      starknetId: profileData.name,
      profilePicture: profileData.profilePicture,
      verifications: {
        twitter: profileData.twitter || undefined,
        github: profileData.github || undefined,
        discord: profileData.discord || undefined
      },
      proofOfPersonhood: profileData.proofOfPersonhood || false
    };
  } catch (error) {
    console.error('Error getting Starknet profile:', error);
    return null;
  }
}

/**
 * Get profiles for multiple Starknet addresses
 * @param addresses List of Starknet addresses
 * @param network Network name (mainnet, sepolia)
 * @returns Array of Starknet profiles
 */
export async function getStarkProfiles(
  addresses: string[],
  network = 'mainnet'
): Promise<(StarkProfile | null)[]> {
  try {
    const navigator = getStarknetIdNavigator(network);
    
    // Get all profiles in parallel with Promise.all
    const profilePromises = addresses.map(address => navigator.getProfileData(address));
    const profilesData = await Promise.all(profilePromises);
    
    return profilesData.map((profileData, index: number) => {
      if (!profileData || (!profileData.name && !profileData.profilePicture)) {
        return null;
      }
      
      return {
        address: addresses[index],
        starknetId: profileData.name,
        profilePicture: profileData.profilePicture,
        verifications: {
          twitter: profileData.twitter || undefined,
          github: profileData.github || undefined,
          discord: profileData.discord || undefined
        },
        proofOfPersonhood: profileData.proofOfPersonhood || false
      };
    });
  } catch (error) {
    console.error('Error getting multiple Starknet profiles:', error);
    return addresses.map(() => null);
  }
}

/**
 * Check if a string is a valid Starknet domain
 * @param domain The domain to check (with or without .stark)
 * @returns True if it's a valid Starknet domain
 */
export function isValidStarknetDomain(domain: string): boolean {
  return starknetIdUtils.isStarkDomain(domain);
}

/**
 * Check if a domain is a Starknet root domain
 * @param domain The domain to check
 * @returns True if it's a Starknet root domain
 */
export function isStarknetRootDomain(domain: string): boolean {
  return starknetIdUtils.isStarkRootDomain(domain);
}

/**
 * Check if a domain is a subdomain
 * @param domain The domain to check
 * @returns True if it's a subdomain
 */
export function isStarknetSubdomain(domain: string): boolean {
  return starknetIdUtils.isSubdomain(domain);
}

/**
 * Encode a domain to its numeric representation
 * @param domain The domain to encode
 * @returns The encoded domain as array of BigInts
 */
export function encodeDomain(domain: string): bigint[] {
  return starknetIdUtils.encodeDomain(domain);
}

/**
 * Decode a domain from its numeric representation
 * @param encoded The encoded domain
 * @returns The decoded domain as string
 */
export function decodeDomain(encoded: bigint[]): string {
  return starknetIdUtils.decodeDomain(encoded);
}

/**
 * Get the Starknet ID contract address based on network
 * @param network Network name (mainnet, sepolia)
 * @returns Contract address
 */
export function getStarknetIdContract(network = 'mainnet'): string {
  const chainId = CHAIN_IDS[network as keyof typeof CHAIN_IDS] || CHAIN_IDS.mainnet;
  return starknetIdUtils.getNamingContract(chainId);
}

/**
 * Get the Starknet ID identity contract address based on network
 * @param network Network name (mainnet, sepolia)
 * @returns Contract address
 */
export function getStarknetIdIdentityContract(network = 'mainnet'): string {
  const chainId = CHAIN_IDS[network as keyof typeof CHAIN_IDS] || CHAIN_IDS.mainnet;
  return starknetIdUtils.getIdentityContract(chainId);
}

/**
 * Get the Starknet ID verifier contract address based on network
 * @param network Network name (mainnet, sepolia)
 * @returns Contract address
 */
export function getStarknetIdVerifierContract(network = 'mainnet'): string {
  const chainId = CHAIN_IDS[network as keyof typeof CHAIN_IDS] || CHAIN_IDS.mainnet;
  return starknetIdUtils.getVerifierContract(chainId);
} 