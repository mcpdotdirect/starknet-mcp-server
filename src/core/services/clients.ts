import { 
  RpcProvider, 
  Account, 
  Contract, 
  ProviderInterface,
  constants,
  validateAndParseAddress
} from 'starknet';
import { getRpcUrl } from '../chains.js';

// Cache for providers to avoid recreating them for each request
const providerCache = new Map<string, RpcProvider>();

// Map of network names to chain IDs for cleaner code
const CHAIN_IDS = {
  mainnet: constants.StarknetChainId.SN_MAIN,
  sepolia: constants.StarknetChainId.SN_SEPOLIA
};

/**
 * Get a RPC provider for a specific network
 * @param network Network name (mainnet, sepolia)
 * @returns RPC provider instance
 */
export function getProvider(network = 'mainnet'): RpcProvider {
  const cacheKey = String(network);
  
  // Return cached provider if available
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey)!;
  }
  
  // Get the RPC URL for the network
  const rpcUrl = getRpcUrl(network);
  
  // Get chain ID, defaulting to mainnet if not recognized
  const chainId = CHAIN_IDS[network as keyof typeof CHAIN_IDS] || CHAIN_IDS.mainnet;
  
  // Create and cache the provider
  const provider = new RpcProvider({ nodeUrl: rpcUrl, chainId });
  providerCache.set(cacheKey, provider);
  
  return provider;
}

/**
 * Create an account instance for a specific network and private key
 * @param privateKey The private key in hex format (with or without 0x prefix)
 * @param accountAddress The address of the deployed account contract
 * @param network Network name (mainnet, sepolia)
 * @returns Account instance
 */
export function getAccount(
  privateKey: string, 
  accountAddress: string, 
  network = 'mainnet'
): Account {
  const provider = getProvider(network);
  
  // Ensure the private key has the proper format
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const formattedAddress = parseStarknetAddress(accountAddress);
  
  return new Account(
    provider,
    formattedAddress,
    formattedPrivateKey
  );
}

/**
 * Create a contract instance
 * @param contractAddress Address of the contract
 * @param provider Optional provider, if not provided a new one will be created
 * @param network Network name
 * @returns Contract instance
 */
export async function getContract(
  contractAddress: string,
  provider?: ProviderInterface,
  network = 'mainnet'
): Promise<Contract> {
  const contractProvider = provider || getProvider(network);
  const formattedAddress = parseStarknetAddress(contractAddress);
  
  // Fetch the contract class using getClassAt to get the ABI
  const contractClass = await contractProvider.getClassAt(formattedAddress);
  const abi = contractClass.abi || [];
  
  return new Contract(
    abi,
    formattedAddress,
    contractProvider
  );
}

/**
 * Parse a Starknet address to ensure it's properly formatted
 * @param address The address to parse
 * @returns The formatted address
 */
export function parseStarknetAddress(address: string): string {
  try {
    // Use StarknetJS's built-in validation
    return validateAndParseAddress(address);
  } catch (error) {
    // If invalid, try to fix common issues - ensure 0x prefix
    if (!address.startsWith('0x')) {
      return parseStarknetAddress(`0x${address}`);
    }
    throw new Error(`Invalid Starknet address: ${address}`);
  }
} 