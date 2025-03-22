import { getProvider, parseStarknetAddress } from './clients.js';
import { constants, type GetTransactionReceiptResponse, type GetTransactionResponse } from 'starknet';

/**
 * Get transaction details
 * @param txHash Transaction hash
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Transaction details
 */
export async function getTransaction(
  txHash: string,
  network = 'mainnet'
): Promise<GetTransactionResponse> {
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
): Promise<GetTransactionReceiptResponse> {
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
  const txReceipt = receipt as any;
  return txReceipt.finality_status === 'ACCEPTED_ON_L1' || txReceipt.finality_status === 'ACCEPTED_ON_L2';
}