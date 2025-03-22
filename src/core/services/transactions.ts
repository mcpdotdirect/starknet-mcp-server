import { getProvider, parseStarknetAddress } from './clients.js';
import { constants } from 'starknet';

/**
 * Get transaction details
 * @param txHash Transaction hash
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Transaction details
 */
export async function getTransaction(
  txHash: string,
  network = 'mainnet'
): Promise<any> {
  const provider = getProvider(network);
  const formattedTxHash = parseStarknetAddress(txHash);
  
  const transaction = await provider.getTransaction(formattedTxHash);
  return transaction;
}

/**
 * Get transaction receipt
 * @param txHash Transaction hash
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Transaction receipt
 */
export async function getTransactionReceipt(
  txHash: string,
  network = 'mainnet'
): Promise<any> {
  const provider = getProvider(network);
  const formattedTxHash = parseStarknetAddress(txHash);
  
  const receipt = await provider.getTransactionReceipt(formattedTxHash);
  return receipt;
}

/**
 * Check if a transaction is confirmed (finalized)
 * @param txHash Transaction hash
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Whether the transaction is confirmed
 */
export async function isTransactionConfirmed(
  txHash: string,
  network = 'mainnet'
): Promise<boolean> {
  const receipt = await getTransactionReceipt(txHash, network);
  return receipt.finality_status === constants.StarknetChainId.SN_MAIN;
}

/**
 * Wait for a transaction to be confirmed (with timeout)
 * @param txHash Transaction hash
 * @param options Optional parameters (timeout, interval)
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns The transaction receipt when confirmed
 */
export async function waitForTransaction(
  txHash: string,
  options: {
    timeout?: number;
    interval?: number;
  } = {},
  network = 'mainnet'
): Promise<any> {
  const provider = getProvider(network);
  const formattedTxHash = parseStarknetAddress(txHash);
  
  const timeoutMs = options.timeout || 60000; // Default 1 minute timeout
  const intervalMs = options.interval || 1000; // Default 1 second polling interval
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const receipt = await provider.getTransactionReceipt(formattedTxHash);
      
      if (receipt.execution_status === 'SUCCEEDED') {
        return receipt;
      }
      
      // If failed, throw error
      if (receipt.execution_status === 'REVERTED') {
        throw new Error(`Transaction reverted: ${receipt.revert_reason || 'Unknown reason'}`);
      }
      
      // Wait for the next polling interval
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error: any) {
      if (error.message.includes('Transaction hash not found')) {
        // Transaction not yet indexed, continue polling
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`Transaction not confirmed within ${timeoutMs}ms timeout`);
} 