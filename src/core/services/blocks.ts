import { getProvider } from './clients.js';
import { BlockIdentifier } from 'starknet';

/**
 * Get block details
 * @param blockIdentifier Block number, hash, or tag ('latest', 'pending')
 * @param network Network name (mainnet, sepolia)
 * @returns Block details
 */
export async function getBlock(
  blockIdentifier: BlockIdentifier = 'latest',
  network = 'mainnet'
) {
  const provider = getProvider(network);
  
  // No need for type conversion - StarknetJS handles this directly
  return provider.getBlock(blockIdentifier);
}

/**
 * Get the latest block number
 * @param network Network name (mainnet, sepolia)
 * @returns The latest block number
 */
export async function getBlockNumber(network = 'mainnet'): Promise<number> {
  const provider = getProvider(network);
  return provider.getBlockNumber();
}

/**
 * Get transactions in a specific block
 * @param blockIdentifier Block number, hash, or tag ('latest', 'pending')
 * @param network Network name (mainnet, sepolia)
 * @returns Array of transaction hashes in the block
 */
export async function getBlockTransactions(
  blockIdentifier: BlockIdentifier = 'latest',
  network = 'mainnet'
): Promise<string[]> {
  const block = await getBlock(blockIdentifier, network);
  return block.transactions || [];
} 