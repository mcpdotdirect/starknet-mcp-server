import { getProvider, parseStarknetAddress } from './clients.js';
import { uint256, shortString } from 'starknet';
import { getContract } from './clients.js';

/**
 * Format a token amount according to its decimals
 * @param amount The raw amount as bigint
 * @param decimals The number of decimals
 * @returns Formatted amount as string
 */
function formatTokenAmount(amount: bigint, decimals: number): string {
  if (decimals === 0) return amount.toString();
  
  const amountStr = amount.toString().padStart(decimals + 1, '0');
  const integerPart = amountStr.slice(0, -decimals) || '0';
  const fractionalPart = amountStr.slice(-decimals);
  
  return `${integerPart}.${fractionalPart}`;
}

/**
 * Get basic information about an ERC20 token
 * @param tokenAddress The token contract address
 * @param network Network name (mainnet, sepolia)
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
  const contract = await getContract(formattedAddress, provider, network);
  
  // Call contract to get token information using parallel requests
  const [nameResponse, symbolResponse, decimalsResponse] = await Promise.all([
    contract.call('name', []),
    contract.call('symbol', []),
    contract.call('decimals', [])
  ]);
  
  // Parse name and symbol using shortString utilities when possible
  let name = '';
  let symbol = '';
  
  try {
    if (typeof nameResponse === 'bigint' || nameResponse.toString().startsWith('0x')) {
      name = shortString.decodeShortString(nameResponse.toString());
    } else if (Array.isArray(nameResponse)) {
      // If it's an array, try to decode each part and join
      name = nameResponse.map(part => {
        try {
          return shortString.decodeShortString(part.toString());
        } catch {
          return part.toString();
        }
      }).join('');
    } else {
      name = nameResponse.toString();
    }
  } catch (error) {
    name = nameResponse.toString();
  }
  
  try {
    if (typeof symbolResponse === 'bigint' || symbolResponse.toString().startsWith('0x')) {
      symbol = shortString.decodeShortString(symbolResponse.toString());
    } else if (Array.isArray(symbolResponse)) {
      // If it's an array, try to decode each part and join
      symbol = symbolResponse.map(part => {
        try {
          return shortString.decodeShortString(part.toString());
        } catch {
          return part.toString();
        }
      }).join('');
    } else {
      symbol = symbolResponse.toString();
    }
  } catch (error) {
    symbol = symbolResponse.toString();
  }
  
  const decimals = Number(decimalsResponse.toString());
  
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
 * @param network Network name (mainnet, sepolia)
 * @returns Total supply in both raw and formatted form
 */
export async function getTokenTotalSupply(
  tokenAddress: string,
  network = 'mainnet'
): Promise<{
  raw: bigint;
  formatted: string;
}> {
  const formattedAddress = parseStarknetAddress(tokenAddress);
  const provider = getProvider(network);
  const contract = await getContract(formattedAddress, provider, network);
  
  // Get token decimals and supply in parallel
  const [decimalsResponse, supplyResponse] = await Promise.all([
    contract.call('decimals', []),
    contract.call('totalSupply', [])
  ]);
  
  const decimals = Number(decimalsResponse.toString());
  
  // Parse result - handle both uint256 and felt representations
  let supply: bigint;
  
  if (Array.isArray(supplyResponse) && supplyResponse.length === 2) {
    // This is likely a uint256 with low and high parts
    supply = uint256.uint256ToBN({ 
      low: supplyResponse[0].toString(), 
      high: supplyResponse[1].toString() 
    });
  } else {
    // Single felt value
    supply = BigInt(supplyResponse.toString());
  }
  
  return {
    raw: supply,
    formatted: formatTokenAmount(supply, decimals)
  };
}