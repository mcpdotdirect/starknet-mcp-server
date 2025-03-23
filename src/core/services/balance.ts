import { getProvider, getContract, parseStarknetAddress } from './clients.js';
import { utils as helpers } from './utils.js';

// Token contract addresses (same for all networks)
const TOKEN_ADDRESSES = {
  ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'
};

/**
 * Format a token amount according to its decimals
 * @param amount The raw amount
 * @param decimals The number of decimals
 * @returns Formatted amount as string
 */
function formatAmount(amount: bigint, decimals: number): string {
  if (decimals === 0) return amount.toString();
  
  const amountStr = amount.toString().padStart(decimals + 1, '0');
  const integerPart = amountStr.slice(0, -decimals) || '0';
  const fractionalPart = amountStr.slice(-decimals);
  
  return `${integerPart}.${fractionalPart}`;
}

/**
 * Get a token balance (any ERC20 token including ETH/STRK)
 * @param tokenAddress Token contract address
 * @param ownerAddress Owner address
 * @param network Network name (mainnet, sepolia)
 * @returns Token balance information
 */
async function getTokenBalance(
  tokenAddress: string, 
  ownerAddress: string, 
  network = 'mainnet'
): Promise<{
  raw: bigint;
  formatted: string;
  decimals: number;
}> {
  const provider = getProvider(network);
  const formattedTokenAddress = parseStarknetAddress(tokenAddress);
  const formattedOwnerAddress = parseStarknetAddress(ownerAddress);
  
  // Create contract instance
  const contract = await getContract(formattedTokenAddress, provider, network);
  
  try {
    // Get balance and decimals in parallel
    const [balanceResponse, decimalsResponse] = await Promise.all([
      contract.call('balanceOf', [formattedOwnerAddress]),
      contract.call('decimals', [])
    ]);
    
    // Parse the responses
    const balance = BigInt(balanceResponse.toString());
    const decimals = Number(decimalsResponse.toString());
    
    return {
      raw: balance,
      formatted: formatAmount(balance, decimals),
      decimals
    };
  } catch (error) {
    console.error(`Error fetching token balance for ${tokenAddress}:`, error);
    return {
      raw: BigInt(0),
      formatted: '0.0',
      decimals: 18 // Default for most tokens
    };
  }
}

/**
 * Get the ETH (or native token) balance for an address
 * @param address Starknet address
 * @param network Network name (mainnet, sepolia)
 * @returns Balance in wei and ether
 */
export async function getETHBalance(
  address: string, 
  network = 'mainnet'
): Promise<{ wei: bigint; ether: string }> {
  const result = await getTokenBalance(TOKEN_ADDRESSES.ETH, address, network);
  
  return {
    wei: result.raw,
    ether: result.formatted
  };
}

/**
 * Get the STRK token balance for an address
 * @param address Starknet address
 * @param network Network name (mainnet, sepolia)
 * @returns Balance in wei and formatted value
 */
export async function getSTRKBalance(
  address: string, 
  network = 'mainnet'
): Promise<{ wei: bigint; formatted: string }> {
  const result = await getTokenBalance(TOKEN_ADDRESSES.STRK, address, network);
  
  return {
    wei: result.raw,
    formatted: result.formatted
  };
}

/**
 * Get balances for all native tokens (ETH and STRK)
 * @param address Starknet address
 * @param network Network name (mainnet, sepolia)
 * @returns Balances for ETH and STRK
 */
export async function getNativeTokenBalances(
  address: string,
  network = 'mainnet'
): Promise<{
  eth: { wei: bigint; ether: string };
  strk: { wei: bigint; formatted: string };
}> {
  // Get both ETH and STRK balances in parallel for efficiency
  const [ethBalance, strkBalance] = await Promise.all([
    getETHBalance(address, network),
    getSTRKBalance(address, network)
  ]);
  
  return {
    eth: ethBalance,
    strk: strkBalance
  };
}

/**
 * Get the balance of an ERC20 token for an address
 * This excludes native tokens (ETH/STRK) which have their own dedicated functions
 * @param tokenAddress Token contract address
 * @param ownerAddress Owner address
 * @param network Network name (mainnet, sepolia)
 * @returns Token balance with formatting information
 */
export async function getERC20Balance(
  tokenAddress: string,
  ownerAddress: string,
  network = 'mainnet'
): Promise<{
  raw: bigint;
  formatted: string;
  token: {
    symbol: string;
    decimals: number;
  }
}> {
  
  // For standard ERC20 token balance retrieval
  const balanceInfo = await getTokenBalance(tokenAddress, ownerAddress, network);
  
  try {
    // Get token symbol
    const provider = getProvider(network);
    const contract = await getContract(parseStarknetAddress(tokenAddress), provider, network);
    const symbolResponse = await contract.call('symbol', []);
    
    // Parse symbol
    let symbol: string;
    if (typeof symbolResponse === 'bigint') {
      symbol = helpers.feltToString(helpers.toFelt(symbolResponse));
    } else {
      symbol = String(symbolResponse);
    }
    
    return {
      raw: balanceInfo.raw,
      formatted: balanceInfo.formatted,
      token: {
        symbol,
        decimals: balanceInfo.decimals
      }
    };
  } catch (error) {
    console.error(`Error fetching token info for ${tokenAddress}:`, error);
    return {
      raw: balanceInfo.raw,
      formatted: balanceInfo.formatted,
      token: {
        symbol: 'UNKNOWN',
        decimals: balanceInfo.decimals
      }
    };
  }
}

/**
 * Check if an address owns a specific NFT
 * @param tokenAddress NFT contract address
 * @param tokenId Token ID to check
 * @param ownerAddress Owner address to check against
 * @param network Network name (mainnet, sepolia)
 * @returns True if the address owns the NFT
 */
export async function isNFTOwner(
  tokenAddress: string,
  tokenId: string | bigint,
  ownerAddress: string,
  network = 'mainnet'
): Promise<boolean> {
  try {
    const provider = getProvider(network);
    const formattedTokenAddress = parseStarknetAddress(tokenAddress);
    const formattedOwnerAddress = parseStarknetAddress(ownerAddress);
    
    // Create NFT contract
    const contract = await getContract(formattedTokenAddress, provider, network);
    
    // Convert tokenId to bigint if it's a string
    const tokenIdBigInt = typeof tokenId === 'string' ? BigInt(tokenId) : tokenId;
    
    // Call ownerOf directly - use low and high parts for Uint256 representation
    const tokenIdObj = {
      low: tokenIdBigInt.toString(),
      high: '0' // For most NFTs, tokenId is below 2^128 so high part is 0
    };
    
    const response = await contract.call('ownerOf', [tokenIdObj]);
    
    // Parse owner address from result
    const actualOwner = String(response).toLowerCase();
    
    return actualOwner === formattedOwnerAddress.toLowerCase();
  } catch (error) {
    console.error(`Error checking NFT ownership:`, error);
    return false;
  }
}

/**
 * Get the number of NFTs owned by an address for a specific collection
 * @param tokenAddress NFT contract address
 * @param ownerAddress Owner address
 * @param network Network name (mainnet, sepolia)
 * @returns Number of NFTs owned
 */
export async function getERC721Balance(
  tokenAddress: string,
  ownerAddress: string,
  network = 'mainnet'
): Promise<bigint> {
  try {
    const provider = getProvider(network);
    const formattedTokenAddress = parseStarknetAddress(tokenAddress);
    const formattedOwnerAddress = parseStarknetAddress(ownerAddress);
    
    // Create NFT contract
    const contract = await getContract(formattedTokenAddress, provider, network);
    
    // Call balanceOf directly
    const response = await contract.call('balanceOf', [formattedOwnerAddress]);
    
    // Parse response directly to BigInt
    return BigInt(response.toString());
  } catch (error) {
    console.error(`Error fetching NFT balance:`, error);
    return BigInt(0);
  }
} 