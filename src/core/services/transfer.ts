import { getProvider, getAccount, getContract, parseStarknetAddress } from './clients.js';
import { CallData, cairo, uint256, constants } from 'starknet';
import { waitForTransaction } from './transactions.js';

// The standard ERC20 transfer selector (function signature)
const ERC20_TRANSFER_SELECTOR = '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e';

/**
 * Transfer ETH (native token) from one account to another
 * @param params Transfer parameters
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Transaction details
 */
export async function transferETH(
  params: {
    privateKey: string;
    from: string;
    to: string;
    amount: string | bigint;
    maxFee?: string | bigint;
  },
  network = 'mainnet'
): Promise<{
  txHash: string;
  waitForConfirmation: () => Promise<any>;
}> {
  const provider = getProvider(network);
  const amount = typeof params.amount === 'string' ? BigInt(params.amount) : params.amount;
  
  const fromAddress = parseStarknetAddress(params.from);
  const toAddress = parseStarknetAddress(params.to);
  
  // Create account instance
  const account = getAccount(params.privateKey, fromAddress, network);
  
  // Prepare transaction
  const tx = {
    contractAddress: toAddress,
    entrypoint: 'transfer',
    calldata: CallData.compile({
      recipient: toAddress,
      amount: { type: 'struct', low: amount.toString(), high: '0' }
    })
  };
  
  // Get fee estimate
  const { suggestedMaxFee } = await account.estimateFee(tx);
  
  // Use provided maxFee or suggested fee from estimation
  const maxFee = params.maxFee ? 
    (typeof params.maxFee === 'string' ? BigInt(params.maxFee) : params.maxFee) : 
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
    waitForConfirmation: () => waitForTransaction(txHash, {}, network)
  };
}

/**
 * Transfer ERC20 tokens from one account to another
 * @param params Transfer parameters
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Transaction details
 */
export async function transferERC20(
  params: {
    privateKey: string;
    from: string;
    to: string;
    tokenAddress: string;
    amount: string | bigint;
    maxFee?: string | bigint;
  },
  network = 'mainnet'
): Promise<{
  txHash: string;
  waitForConfirmation: () => Promise<any>;
}> {
  const amount = typeof params.amount === 'string' ? BigInt(params.amount) : params.amount;
  
  const fromAddress = parseStarknetAddress(params.from);
  const toAddress = parseStarknetAddress(params.to);
  const tokenAddress = parseStarknetAddress(params.tokenAddress);
  
  // Create account instance
  const account = getAccount(params.privateKey, fromAddress, network);
  
  // Convert amount to uint256 (low, high)
  const amountUint256 = uint256.bnToUint256(amount);
  
  // Prepare transaction
  const tx = {
    contractAddress: tokenAddress,
    entrypoint: 'transfer',
    calldata: CallData.compile({
      recipient: toAddress,
      amount: amountUint256
    })
  };
  
  // Get fee estimate
  const { suggestedMaxFee } = await account.estimateFee(tx);
  
  // Use provided maxFee or suggested fee from estimation
  const maxFee = params.maxFee ? 
    (typeof params.maxFee === 'string' ? BigInt(params.maxFee) : params.maxFee) : 
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
    waitForConfirmation: () => waitForTransaction(txHash, {}, network)
  };
}

/**
 * Execute an arbitrary contract call
 * @param params Call parameters
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Transaction details
 */
export async function executeContract(
  params: {
    privateKey: string;
    accountAddress: string;
    contractAddress: string;
    entrypoint: string;
    calldata?: any[];
    maxFee?: string | bigint;
  },
  network = 'mainnet'
): Promise<{
  txHash: string;
  waitForConfirmation: () => Promise<any>;
}> {
  const accountAddress = parseStarknetAddress(params.accountAddress);
  const contractAddress = parseStarknetAddress(params.contractAddress);
  
  // Create account instance
  const account = getAccount(params.privateKey, accountAddress, network);
  
  // Prepare transaction
  const tx = {
    contractAddress,
    entrypoint: params.entrypoint,
    calldata: params.calldata || []
  };
  
  // Get fee estimate
  const { suggestedMaxFee } = await account.estimateFee(tx);
  
  // Use provided maxFee or suggested fee from estimation
  const maxFee = params.maxFee ? 
    (typeof params.maxFee === 'string' ? BigInt(params.maxFee) : params.maxFee) : 
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
    waitForConfirmation: () => waitForTransaction(txHash, {}, network)
  };
} 