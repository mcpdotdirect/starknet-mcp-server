import { getProvider } from './clients.js';

/**
 * Get block details
 * @param blockIdentifier Block number, hash, or tag ('latest', 'pending')
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Block details
 */
export async function getBlock(
  blockIdentifier: string | number = 'latest',
  network = 'mainnet'
): Promise<any> {
  const provider = getProvider(network);
  
  // Handle different types of block identifiers
  let identifier: string | number = blockIdentifier;
  
  // Convert numeric string to number if it's a block number
  if (typeof blockIdentifier === 'string' && /^\d+$/.test(blockIdentifier)) {
    identifier = parseInt(blockIdentifier, 10);
  }
  
  const block = await provider.getBlock(identifier);
  return block;
}

/**
 * Get the latest block number
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns The latest block number
 */
export async function getBlockNumber(network = 'mainnet'): Promise<number> {
  const provider = getProvider(network);
  const blockNumber = await provider.getBlockNumber();
  return blockNumber;
}

/**
 * Get transactions in a specific block
 * @param blockIdentifier Block number, hash, or tag ('latest', 'pending')
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Array of transaction hashes in the block
 */
export async function getBlockTransactions(
  blockIdentifier: string | number = 'latest',
  network = 'mainnet'
): Promise<string[]> {
  const block = await getBlock(blockIdentifier, network);
  return block.transactions || [];
} 