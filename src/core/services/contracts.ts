import { getProvider, parseStarknetAddress } from './clients.js';
import { utils as helpers } from './utils.js';

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
  
  const storageValue = await provider.getStorageAt(
    formattedAddress,
    key,
    'latest'
  );
  
  return storageValue;
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
  
  const classHash = await provider.getClassHashAt(
    formattedAddress,
    'latest'
  );
  
  return classHash;
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
): Promise<any> {
  const provider = getProvider(network);
  const formattedClassHash = parseStarknetAddress(classHash);
  
  const contractClass = await provider.getClass(
    formattedClassHash,
    'latest'
  );
  
  return contractClass;
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
): Promise<any[]> {
  const provider = getProvider(network);
  const formattedAddress = parseStarknetAddress(params.contractAddress);
  
  // Ensure calldata is properly formatted
  const calldata = params.calldata ? 
    params.calldata.map(item => {
      // If we're passing something that might be a bigint, ensure proper formatting
      if (typeof item === 'bigint') {
        return helpers.toFelt(item);
      }
      return item;
    }) : 
    [];
  
  const result = await provider.callContract({
    contractAddress: formattedAddress,
    entrypoint: params.entrypoint,
    calldata
  });
  
  // Process result - convert any bigint values to hex strings
  const processedResult = result.map(item => {
    if (typeof item === 'bigint') {
      return helpers.toFelt(item);
    }
    return item;
  });
  
  return processedResult;
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
    // Default: treat all values as felts
    return result.map(value => {
      if (typeof value === 'bigint') {
        return helpers.toFelt(value);
      }
      return value;
    });
  }
  
  return result.map((value, index) => {
    const type = index < expectedTypes.length ? expectedTypes[index] : 'felt';
    return helpers.formatContractValue(value, type);
  });
} 