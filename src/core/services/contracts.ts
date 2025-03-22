import { getProvider, parseStarknetAddress } from './clients.js';
import { CallData, BlockTag } from 'starknet';
import { utils as helpers } from './utils.js';

// Default block tag to use for queries
const DEFAULT_BLOCK_TAG: BlockTag = 'latest';

/**
 * Read a contract's storage at a specific slot
 * @param contractAddress Contract address
 * @param key Storage key/slot
 * @param network Network name (mainnet, sepolia)
 * @returns The storage value as a hex string
 */
export async function getStorageAt(
  contractAddress: string,
  key: string,
  network = 'mainnet'
): Promise<string> {
  const provider = getProvider(network);
  const formattedAddress = parseStarknetAddress(contractAddress);
  
  return provider.getStorageAt(formattedAddress, key, DEFAULT_BLOCK_TAG);
}

/**
 * Get the class hash of a contract
 * @param contractAddress Contract address
 * @param network Network name (mainnet, sepolia)
 * @returns The class hash of the contract
 */
export async function getClassHashAt(
  contractAddress: string,
  network = 'mainnet'
): Promise<string> {
  const provider = getProvider(network);
  const formattedAddress = parseStarknetAddress(contractAddress);
  
  return provider.getClassHashAt(formattedAddress, DEFAULT_BLOCK_TAG);
}

/**
 * Get the contract class (ABI and other information) for a given class hash
 * @param classHash The class hash
 * @param network Network name (mainnet, sepolia)
 * @returns The contract class object
 */
export async function getClass(
  classHash: string,
  network = 'mainnet'
) {
  const provider = getProvider(network);
  const formattedClassHash = parseStarknetAddress(classHash);
  
  return provider.getClass(formattedClassHash, DEFAULT_BLOCK_TAG);
}

/**
 * Call a read-only function on a contract
 * @param params Call parameters
 * @param network Network name (mainnet, sepolia)
 * @returns The result of the call
 */
export async function callContract(
  params: {
    contractAddress: string;
    entrypoint: string;
    calldata?: any[];
  },
  network = 'mainnet'
) {
  const provider = getProvider(network);
  const formattedAddress = parseStarknetAddress(params.contractAddress);
  
  // Format calldata with StarknetJS's CallData utility
  const calldata = params.calldata ? 
    CallData.compile(params.calldata) : 
    [];
  
  const result = await provider.callContract({
    contractAddress: formattedAddress,
    entrypoint: params.entrypoint,
    calldata
  }, DEFAULT_BLOCK_TAG);
  
  return result;
}

/**
 * Format contract call results based on expected types
 * @param result Raw result from contract call
 * @param expectedTypes Array of expected types for each result item
 * @returns Formatted result
 */
export function formatCallResult(
  result: any[], 
  expectedTypes?: Array<'felt' | 'uint256' | 'address' | 'string'>
): any[] {
  if (!expectedTypes) {
    // Return raw results - modern StarknetJS returns properly formatted values
    return result;
  }
  
  return result.map((value, index) => {
    const type = index < expectedTypes.length ? expectedTypes[index] : 'felt';
    return helpers.formatContractValue(value, type);
  });
} 