import { getProvider, parseStarknetAddress } from './clients.js';
import { CallData, uint256, num } from 'starknet';

/**
 * Get basic information about an ERC20 token
 * @param tokenAddress The token contract address
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Token information
 */
export async function getTokenInfo(
  tokenAddress: string,
  network = 'mainnet'
): Promise<{
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}> {
  const provider = getProvider(network);
  const formattedAddress = parseStarknetAddress(tokenAddress);
  
  // Call contract to get token information
  const [nameResult, symbolResult, decimalsResult] = await Promise.all([
    provider.callContract({
      contractAddress: formattedAddress,
      entrypoint: 'name',
      calldata: []
    }),
    provider.callContract({
      contractAddress: formattedAddress,
      entrypoint: 'symbol',
      calldata: []
    }),
    provider.callContract({
      contractAddress: formattedAddress,
      entrypoint: 'decimals',
      calldata: []
    })
  ]);
  
  // Parse results
  let name = '';
  let symbol = '';
  
  // Check if it's a short string (single felt) or an array of felts for a longer string
  if (nameResult.length === 1) {
    try {
      // Try to parse as a short string
      name = Buffer.from(num.toHex(Number(nameResult[0])).slice(2), 'hex').toString('utf-8');
    } catch {
      // If that fails, just use the raw value
      name = nameResult[0].toString();
    }
  } else {
    // Handle array of felts for longer strings (simplified approach)
    name = nameResult.map(n => n.toString()).join('');
  }
  
  if (symbolResult.length === 1) {
    try {
      symbol = Buffer.from(num.toHex(Number(symbolResult[0])).slice(2), 'hex').toString('utf-8');
    } catch {
      symbol = symbolResult[0].toString();
    }
  } else {
    symbol = symbolResult.map(n => n.toString()).join('');
  }
  
  const decimals = Number(decimalsResult[0]);
  
  return {
    address: formattedAddress,
    name,
    symbol,
    decimals
  };
}

/**
 * Get the total supply of an ERC20 token
 * @param tokenAddress The token contract address
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns Total supply in both raw and formatted form
 */
export async function getTokenTotalSupply(
  tokenAddress: string,
  network = 'mainnet'
): Promise<{
  raw: bigint;
  formatted: string;
}> {
  const provider = getProvider(network);
  const formattedAddress = parseStarknetAddress(tokenAddress);
  
  // Get token decimals first
  const decimalsResult = await provider.callContract({
    contractAddress: formattedAddress,
    entrypoint: 'decimals',
    calldata: []
  });
  
  const decimals = Number(decimalsResult[0]);
  
  // Get total supply
  const supplyResult = await provider.callContract({
    contractAddress: formattedAddress,
    entrypoint: 'totalSupply',
    calldata: []
  });
  
  // Parse result - typically a uint256 with low and high parts
  let supply: bigint;
  if (supplyResult.length === 2) {
    supply = uint256.uint256ToBN({ low: supplyResult[0], high: supplyResult[1] });
  } else {
    supply = BigInt(supplyResult[0]);
  }
  
  // Format the supply according to its decimals
  let formatted: string;
  if (decimals === 0) {
    formatted = supply.toString();
  } else {
    const supplyStr = supply.toString().padStart(decimals + 1, '0');
    const integerPart = supplyStr.slice(0, -decimals) || '0';
    const fractionalPart = supplyStr.slice(-decimals);
    formatted = `${integerPart}.${fractionalPart}`;
  }
  
  return {
    raw: supply,
    formatted
  };
}

/**
 * Get list of token holders (not fully supported on Starknet)
 * @param tokenAddress The token contract address
 * @param network Network name (mainnet, goerli, sepolia)
 * @returns A notice about Starknet limitations
 */
export async function getTokenHolders(
  tokenAddress: string,
  network = 'mainnet'
): Promise<{ notice: string }> {
  return {
    notice: "Starknet doesn't provide a standard way to enumerate token holders. This would require an indexer service or a specific contract design that tracks holders."
  };
} 