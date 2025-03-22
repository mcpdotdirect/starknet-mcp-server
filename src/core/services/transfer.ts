import { getProvider, getAccount, getContract, parseStarknetAddress } from './clients.js';
import { CallData, cairo, uint256, constants } from 'starknet';
import { utils } from './utils.js';

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
    to: string; // Can be an address or a StarkNet ID
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
  
  // Resolve the 'to' parameter which could be either an address or a StarkNet ID
  const toAddress = parseStarknetAddress(await utils.resolveNameOrAddress(params.to, network));
  
  // Create account instance
  const account = getAccount(params.privateKey, fromAddress, network);
  
  // Prepare transaction
  const tx = {
    contractAddress: toAddress,
    entrypoint: 'transfer',
    calldata: CallData.compile({
      recipient: toAddress,
      amount: uint256.bnToUint256(amount)
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
    waitForConfirmation: () => provider.waitForTransaction(txHash)
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
    to: string; // Can be an address or a StarkNet ID
    tokenAddress: string;
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
  
  // Resolve the 'to' parameter which could be either an address or a StarkNet ID
  const toAddress = parseStarknetAddress(await utils.resolveNameOrAddress(params.to, network));
  
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
    waitForConfirmation: () => provider.waitForTransaction(txHash)
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
    contractAddress: string; // Can be an address or a StarkNet ID
    entrypoint: string;
    calldata?: any[];
    maxFee?: string | bigint;
  },
  network = 'mainnet'
): Promise<{
  txHash: string;
  waitForConfirmation: () => Promise<any>;
}> {
  const provider = getProvider(network);
  const accountAddress = parseStarknetAddress(params.accountAddress);
  
  // Resolve the contract address which could be either an address or a StarkNet ID
  const contractAddress = parseStarknetAddress(await utils.resolveNameOrAddress(params.contractAddress, network));
  
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
    waitForConfirmation: () => provider.waitForTransaction(txHash)
  };
} 