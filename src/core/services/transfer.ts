import { getProvider, getAccount, getContract, parseStarknetAddress } from './clients.js';
import { CallData, cairo, uint256, constants } from 'starknet';
import { utils } from './utils.js';

// Common token contract addresses (same for all networks)
const TOKEN_ADDRESSES = {
  ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'
};

// Default decimals for common tokens
const TOKEN_DECIMALS = {
  ETH: 18,
  STRK: 18
};

// Common interface for all transfer operations
interface TransferResult {
  txHash: string;
  waitForConfirmation: () => Promise<any>;
}

// Common parameters for all transfer operations
interface TransferBaseParams {
  privateKey: string;
  from: string;
  to: string; // Can be an address or a Starknet ID
  amount: string | bigint;
  maxFee?: string | bigint;
}

/**
 * Converts a human-readable amount to token units
 * @param amount The amount in human-readable form (e.g., "0.00001")
 * @param decimals The number of decimals for the token
 * @returns The amount in token units as BigInt
 */
function parseTokenAmount(amount: string | bigint, decimals: number): bigint {
  // If amount is already a bigint, assume it's already in token units
  if (typeof amount === 'bigint') {
    return amount;
  }
  
  // Handle decimal amounts
  const amountStr = amount.toString();
  
  // Check if the amount contains a decimal point
  if (amountStr.includes('.')) {
    const [integerPart, fractionalPart = ''] = amountStr.split('.');
    
    // Ensure the fractional part isn't longer than allowed decimals
    if (fractionalPart.length > decimals) {
      throw new Error(`Amount has too many decimal places. Maximum allowed: ${decimals}`);
    }
    
    // Pad the fractional part with zeros if needed
    const paddedFractionalPart = fractionalPart.padEnd(decimals, '0');
    
    // Combine the integer and fractional parts without the decimal point
    const combinedAmount = `${integerPart}${paddedFractionalPart}`;
    
    // Remove leading zeros (if any) and convert to BigInt
    return BigInt(combinedAmount.replace(/^0+/, '') || '0');
  }
  
  // No decimal point, multiply by 10^decimals
  return BigInt(amountStr) * BigInt(10) ** BigInt(decimals);
}

/**
 * Prepare a transfer transaction
 * @param params Common transfer parameters
 * @param tokenAddress The token contract address
 * @param decimals The number of decimals for the token
 * @param network Network name
 * @returns Prepared account, transaction, and addresses
 */
async function prepareTransfer(
  params: TransferBaseParams,
  tokenAddress: string,
  decimals: number,
  network: string
) {
  // Convert amount to token units, accounting for decimals
  const amount = parseTokenAmount(params.amount, decimals);
  const fromAddress = parseStarknetAddress(params.from);
  
  // Resolve the 'to' parameter which could be either an address or a Starknet ID
  const toAddress = parseStarknetAddress(await utils.resolveNameOrAddress(params.to, network));
  
  // Create account instance
  const account = getAccount(params.privateKey, fromAddress, network);
  
  // Prepare transaction
  const tx = {
    contractAddress: tokenAddress,
    entrypoint: 'transfer',
    calldata: CallData.compile({
      recipient: toAddress,
      amount: uint256.bnToUint256(amount)
    })
  };
  
  return { account, tx, amount, fromAddress, toAddress };
}

/**
 * Execute a prepared transaction with proper fee estimation
 * @param account The account instance
 * @param tx The transaction object
 * @param maxFeeOverride Optional override for max fee
 * @param network Network name
 * @returns Transaction result
 */
async function executeTransaction(
  account: any,
  tx: any,
  maxFeeOverride: string | bigint | undefined,
  network: string
): Promise<TransferResult> {
  const provider = getProvider(network);
  
  try {
    // Get fee estimate
    const { suggestedMaxFee } = await account.estimateFee(tx);
    
    // Use provided maxFee or suggested fee from estimation
    const maxFee = maxFeeOverride ? 
      (typeof maxFeeOverride === 'string' ? BigInt(maxFeeOverride) : maxFeeOverride) : 
      suggestedMaxFee;
    
    // Execute transaction
    const response = await account.execute(
      tx,
      undefined,
      { maxFee }
    );
    
    const txHash = response.transaction_hash;
    
    return {
      txHash,
      waitForConfirmation: () => provider.waitForTransaction(txHash)
    };
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw new Error(`Transaction failed: ${(error as Error).message}`);
  }
}

/**
 * Transfer ETH (native token) from one account to another
 * @param params Transfer parameters
 * @param network Network name (mainnet, sepolia)
 * @returns Transaction details
 */
export async function transferETH(
  params: TransferBaseParams,
  network = 'mainnet'
): Promise<TransferResult> {
  try {
    const { account, tx } = await prepareTransfer(
      params, 
      TOKEN_ADDRESSES.ETH,
      TOKEN_DECIMALS.ETH,
      network
    );
    
    return executeTransaction(account, tx, params.maxFee, network);
  } catch (error) {
    console.error('Error transferring ETH:', error);
    throw new Error(`ETH transfer failed: ${(error as Error).message}`);
  }
}

/**
 * Transfer STRK (fee token) from one account to another
 * @param params Transfer parameters
 * @param network Network name (mainnet, sepolia)
 * @returns Transaction details
 */
export async function transferSTRK(
  params: TransferBaseParams,
  network = 'mainnet'
): Promise<TransferResult> {
  try {
    const { account, tx } = await prepareTransfer(
      params, 
      TOKEN_ADDRESSES.STRK,
      TOKEN_DECIMALS.STRK,
      network
    );
    
    return executeTransaction(account, tx, params.maxFee, network);
  } catch (error) {
    console.error('Error transferring STRK:', error);
    throw new Error(`STRK transfer failed: ${(error as Error).message}`);
  }
}

/**
 * Transfer ERC20 tokens from one account to another
 * @param params Transfer parameters
 * @param network Network name (mainnet, sepolia)
 * @returns Transaction details
 */
export async function transferERC20(
  params: TransferBaseParams & { tokenAddress: string; decimals?: number },
  network = 'mainnet'
): Promise<TransferResult> {
  try {
    const tokenAddress = parseStarknetAddress(params.tokenAddress);
    
    // If decimals not provided, fetch them from the token contract
    let decimals = params.decimals;
    if (decimals === undefined) {
      const provider = getProvider(network);
      const contract = await getContract(tokenAddress, provider, network);
      const decimalsResponse = await contract.call('decimals', []);
      decimals = Number(decimalsResponse.toString());
    }
    
    const { account, tx } = await prepareTransfer(
      params, 
      tokenAddress,
      decimals,
      network
    );
    
    return executeTransaction(account, tx, params.maxFee, network);
  } catch (error) {
    console.error('Error transferring ERC20 token:', error);
    throw new Error(`ERC20 transfer failed: ${(error as Error).message}`);
  }
}

/**
 * Execute an arbitrary contract call
 * @param params Call parameters
 * @param network Network name (mainnet, sepolia)
 * @returns Transaction details
 */
export async function executeContract(
  params: {
    privateKey: string;
    accountAddress: string;
    contractAddress: string; // Can be an address or a Starknet ID
    entrypoint: string;
    calldata?: any[];
    maxFee?: string | bigint;
  },
  network = 'mainnet'
): Promise<TransferResult> {
  try {
    const accountAddress = parseStarknetAddress(params.accountAddress);
    
    // Resolve the contract address which could be either an address or a Starknet ID
    const contractAddress = parseStarknetAddress(
      await utils.resolveNameOrAddress(params.contractAddress, network)
    );
    
    // Create account instance
    const account = getAccount(params.privateKey, accountAddress, network);
    
    // Prepare transaction
    const tx = {
      contractAddress,
      entrypoint: params.entrypoint,
      calldata: params.calldata ? CallData.compile(params.calldata) : []
    };
    
    return executeTransaction(account, tx, params.maxFee, network);
  } catch (error) {
    console.error('Error executing contract call:', error);
    throw new Error(`Contract execution failed: ${(error as Error).message}`);
  }
} 