import { getProvider, parseStarknetAddress } from './clients.js';
import { 
  type GetTransactionReceiptResponse, 
  type GetTransactionResponse,
  TransactionFinalityStatus
} from 'starknet';

/**
 * Get transaction details
 * @param txHash Transaction hash
 * @param network Network name (mainnet, sepolia)
 * @returns Transaction details
 */
export async function getTransaction(
  txHash: string,
  network = 'mainnet'
): Promise<GetTransactionResponse> {
  const provider = getProvider(network);
  const formattedTxHash = parseStarknetAddress(txHash);
  return provider.getTransaction(formattedTxHash);
}

/**
 * Get transaction receipt
 * @param txHash Transaction hash
 * @param network Network name (mainnet, sepolia)
 * @returns Transaction receipt
 */
export async function getTransactionReceipt(
  txHash: string,
  network = 'mainnet'
): Promise<GetTransactionReceiptResponse> {
  const provider = getProvider(network);
  const formattedTxHash = parseStarknetAddress(txHash);
  return provider.getTransactionReceipt(formattedTxHash);
}

/**
 * Check if a transaction is confirmed (finalized)
 * @param txHash Transaction hash
 * @param network Network name (mainnet, sepolia)
 * @returns Whether the transaction is confirmed
 */
export async function isTransactionConfirmed(
  txHash: string,
  network = 'mainnet'
): Promise<boolean> {
  try {
    const receipt = await getTransactionReceipt(txHash, network);
    
    // Need to cast to any due to the specific typing in StarknetJS
    // The receipt actually does have a finality_status property at runtime
    const typedReceipt = receipt as any;
    
    // Check if the finality_status indicates the transaction is accepted
    return (
      typedReceipt.finality_status === TransactionFinalityStatus.ACCEPTED_ON_L1 || 
      typedReceipt.finality_status === TransactionFinalityStatus.ACCEPTED_ON_L2
    );
  } catch (error) {
    console.error(`Error checking transaction ${txHash} status:`, error);
    return false;
  }
}

/**
 * Get transaction status details
 * @param txHash Transaction hash
 * @param network Network name (mainnet, sepolia)
 * @returns Detailed transaction status information
 */
export async function getTransactionStatus(
  txHash: string,
  network = 'mainnet'
): Promise<{
  hash: string;
  status: string;
  finality: string;
  blockNumber?: number;
  executionStatus?: string;
  isSuccessful: boolean;
}> {
  try {
    const receipt = await getTransactionReceipt(txHash, network);
    const transaction = await getTransaction(txHash, network);
    
    // Use type assertions since the TypeScript types don't exactly
    // match the actual runtime properties from the RPC
    const typedReceipt = receipt as any;
    const typedTransaction = transaction as any;
    
    return {
      hash: txHash,
      status: typedTransaction.status || 'UNKNOWN',
      finality: typedReceipt.finality_status || 'UNKNOWN',
      blockNumber: typedReceipt.block_number,
      executionStatus: typedReceipt.execution_status,
      isSuccessful: 
        typedReceipt.execution_status === 'SUCCEEDED' && 
        (typedReceipt.finality_status === TransactionFinalityStatus.ACCEPTED_ON_L1 || 
         typedReceipt.finality_status === TransactionFinalityStatus.ACCEPTED_ON_L2)
    };
  } catch (error) {
    console.error(`Error getting transaction ${txHash} status:`, error);
    return {
      hash: txHash,
      status: 'UNKNOWN',
      finality: 'UNKNOWN',
      isSuccessful: false
    };
  }
}