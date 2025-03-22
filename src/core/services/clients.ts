import { 
  RpcProvider, 
  Account, 
  Contract, 
  ProviderInterface,
  constants
} from 'starknet';
import { getRpcUrl, getChainId } from '../chains.js';

// Cache for providers to avoid recreating them for each request
const providerCache = new Map<string, RpcProvider>();

/**
 * Get a RPC provider for a specific network
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns RPC provider instance
 */
export function getProvider(network = 'mainnet'): RpcProvider {
  const cacheKey = String(network);
  
  // Return cached provider if available
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey)!;
  }
  
  // Create a new provider
  const rpcUrl = getRpcUrl(network);
  const chainId = getChainId(network);
  
  const provider = new RpcProvider({
    nodeUrl: rpcUrl,
    chainId
  });
  
  // Cache the provider
  providerCache.set(cacheKey, provider);
  
  return provider;
}

/**
 * Create an account instance for a specific network and private key
 * @param privateKey The private key in hex format (with or without 0x prefix)
 * @param accountAddress The address of the deployed account contract
 * @param network Network name (mainnet, goerli, sepolia)
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
  
  return new Account(
    provider,
    accountAddress,
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
export function getContract(
  contractAddress: string,
  provider?: ProviderInterface,
  network = 'mainnet'
): Contract {
  const contractProvider = provider || getProvider(network);
  
  return new Contract(
    [], // No ABI needed initially - can be set later using contract.attachABI()
    contractAddress,
    contractProvider
  );
}

/**
 * Parse a StarkNet address to ensure it's properly formatted
 * @param address The address to parse
 * @returns The formatted address
 */
export function parseStarknetAddress(address: string): string {
  // Ensure the address has the proper format
  if (!address.startsWith('0x')) {
    return `0x${address}`;
  }
  return address;
} 