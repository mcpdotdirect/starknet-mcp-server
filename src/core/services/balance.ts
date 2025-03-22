import { getProvider, getContract, parseStarknetAddress } from './clients.js';
import { uint256, num } from 'starknet';
import { CallData } from 'starknet';
import { utils as helpers } from './utils.js';

// Token contract addresses by network
type NetworkAddresses = {
  [key: string]: string;
};

const TOKEN_ADDRESSES: {
  ETH: NetworkAddresses;
  STRK: NetworkAddresses;
} = {
  // ETH contract addresses
  ETH: {
    mainnet: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    sepolia: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
  },
  // STRK contract addresses
  STRK: {
    mainnet: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    sepolia: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'
  }
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
 * Get the ETH (or native token) balance for an address
 * @param address Starknet address
 * @param network Network name (mainnet, sepolia)
 * @returns Balance in wei and ether
 */
export async function getETHBalance(
  address: string, 
  network = 'mainnet'
): Promise<{ wei: bigint; ether: string }> {
  const provider = getProvider(network);
  const formattedAddress = parseStarknetAddress(address);
  
  // ETH is managed by the ETH contract
  const contractAddress = TOKEN_ADDRESSES.ETH[network as keyof typeof TOKEN_ADDRESSES.ETH] || TOKEN_ADDRESSES.ETH.mainnet;
  const ethContract = getContract(contractAddress, provider, network);
  
  // Get the class hash to fetch the ABI
  const classHash = await provider.getClassHashAt(ethContract.address, 'latest');
  const contractClass = await provider.getClass(classHash, 'latest');
  
  // Attach the ABI
  ethContract.attachABI(contractClass.abi);
  
  // Call balanceOf
  const balanceResponse = await ethContract.balanceOf(formattedAddress);
  
  // Parse the balance (uint256)
  const balanceWei = uint256.uint256ToBN(balanceResponse.balance);
  
  return {
    wei: balanceWei,
    ether: formatAmount(balanceWei, 18)
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
  const provider = getProvider(network);
  const formattedAddress = parseStarknetAddress(address);
  
  // STRK token contract
  const contractAddress = TOKEN_ADDRESSES.STRK[network as keyof typeof TOKEN_ADDRESSES.STRK] || TOKEN_ADDRESSES.STRK.mainnet;
  const strkContract = getContract(contractAddress, provider, network);
  
  // Get the class hash to fetch the ABI
  const classHash = await provider.getClassHashAt(strkContract.address, 'latest');
  const contractClass = await provider.getClass(classHash, 'latest');
  
  // Attach the ABI
  strkContract.attachABI(contractClass.abi);
  
  // Call balanceOf and get decimals
  const [balanceResponse, decimalsResult] = await Promise.all([
    strkContract.balanceOf(formattedAddress),
    strkContract.decimals()
  ]);
  
  // Parse the balance (uint256)
  const balanceWei = uint256.uint256ToBN(balanceResponse.balance);
  const decimals = Number(decimalsResult);
  
  return {
    wei: balanceWei,
    formatted: formatAmount(balanceWei, decimals)
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
  // Get both ETH and STRK balances in parallel
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
  // Check if this is a native token request
  if (tokenAddress.toLowerCase() === TOKEN_ADDRESSES.ETH[network as keyof typeof TOKEN_ADDRESSES.ETH].toLowerCase()) {
    const balance = await getETHBalance(ownerAddress, network);
    return {
      raw: balance.wei,
      formatted: balance.ether,
      token: {
        symbol: 'ETH',
        decimals: 18
      }
    };
  } else if (tokenAddress.toLowerCase() === TOKEN_ADDRESSES.STRK[network as keyof typeof TOKEN_ADDRESSES.STRK].toLowerCase()) {
    const balance = await getSTRKBalance(ownerAddress, network);
    return {
      raw: balance.wei,
      formatted: balance.formatted,
      token: {
        symbol: 'STRK',
        decimals: 18
      }
    };
  }

  const provider = getProvider(network);
  const formattedTokenAddress = parseStarknetAddress(tokenAddress);
  const formattedOwnerAddress = parseStarknetAddress(ownerAddress);

  // Create token contract
  const tokenContract = getContract(formattedTokenAddress, provider, network);
  
  // Get class hash and class to fetch the ABI
  const classHash = await provider.getClassHashAt(formattedTokenAddress, 'latest');
  const contractClass = await provider.getClass(classHash, 'latest');
  
  // Attach the ABI
  tokenContract.attachABI(contractClass.abi);

  // Get token details (symbol and decimals)
  const [symbolResult, decimalsResult, balanceResponse] = await Promise.all([
    tokenContract.symbol(),
    tokenContract.decimals(),
    tokenContract.balanceOf(formattedOwnerAddress)
  ]);

  // Parse token details and balance
  let parsedSymbol: string;
  let balance: bigint;
  
  // Parse symbol - handle both numeric and string representations
  if (typeof symbolResult === 'bigint') {
    // If symbol is returned as a felt (bigint), convert to string
    parsedSymbol = helpers.feltToString(helpers.toFelt(symbolResult));
  } else if (typeof symbolResult === 'string') {
    parsedSymbol = symbolResult;
  } else {
    // If it's an array or object, try to stringify it
    parsedSymbol = symbolResult.toString();
  }
  
  // Parse decimals
  const parsedDecimals = Number(decimalsResult);
  
  // Parse balance - handle different return formats
  if (balanceResponse.balance) {
    // Some tokens return { balance: uint256 }
    balance = uint256.uint256ToBN(balanceResponse.balance);
  } else if (typeof balanceResponse === 'object' && 'low' in balanceResponse && 'high' in balanceResponse) {
    // Some tokens return uint256 directly
    balance = uint256.uint256ToBN(balanceResponse);
  } else {
    // Some tokens return a single felt
    balance = BigInt(balanceResponse.toString());
  }

  return {
    raw: balance,
    formatted: formatAmount(balance, parsedDecimals),
    token: {
      symbol: parsedSymbol,
      decimals: parsedDecimals
    }
  };
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
    const nftContract = getContract(formattedTokenAddress, provider, network);
    
    // Get class hash and class to fetch the ABI
    const classHash = await provider.getClassHashAt(formattedTokenAddress, 'latest');
    const contractClass = await provider.getClass(classHash, 'latest');
    
    // Attach the ABI
    nftContract.attachABI(contractClass.abi);
    
    // Convert tokenId to bigint if it's a string
    const tokenIdBigInt = typeof tokenId === 'string' ? BigInt(tokenId) : tokenId;
    
    // Convert tokenId to uint256
    const tokenIdUint256 = helpers.bigintToUint256(tokenIdBigInt);
    
    // Call ownerOf
    const ownerResponse = await nftContract.ownerOf(tokenIdUint256);
    
    // Parse owner response
    let actualOwner: string;
    if (typeof ownerResponse === 'string') {
      actualOwner = ownerResponse;
    } else if (typeof ownerResponse === 'bigint') {
      actualOwner = helpers.formatAddress(ownerResponse);
    } else if (ownerResponse.owner) {
      // Handle case where response is { owner: '0x...' }
      const owner = ownerResponse.owner;
      actualOwner = typeof owner === 'bigint' ? helpers.formatAddress(owner) : owner.toString();
    } else {
      actualOwner = ownerResponse.toString();
    }
    
    return actualOwner.toLowerCase() === formattedOwnerAddress.toLowerCase();
  } catch (error: any) {
    console.error(`Error checking NFT ownership: ${error.message}`);
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
  const provider = getProvider(network);
  const formattedTokenAddress = parseStarknetAddress(tokenAddress);
  const formattedOwnerAddress = parseStarknetAddress(ownerAddress);
  
  // Create NFT contract
  const nftContract = getContract(formattedTokenAddress, provider, network);
  
  // Get class hash and class to fetch the ABI
  const classHash = await provider.getClassHashAt(formattedTokenAddress, 'latest');
  const contractClass = await provider.getClass(classHash, 'latest');
  
  // Attach the ABI
  nftContract.attachABI(contractClass.abi);
  
  // Call balanceOf
  const balanceResponse = await nftContract.balanceOf(formattedOwnerAddress);
  
  // Parse balance
  let balance: bigint;
  if (balanceResponse.balance) {
    // Some tokens return { balance: uint256 }
    balance = uint256.uint256ToBN(balanceResponse.balance);
  } else if (typeof balanceResponse === 'object' && 'low' in balanceResponse && 'high' in balanceResponse) {
    // Some tokens return uint256 directly
    balance = uint256.uint256ToBN(balanceResponse);
  } else if (typeof balanceResponse === 'bigint') {
    // Some tokens return a single felt as bigint
    balance = balanceResponse;
  } else {
    // Other formats
    balance = BigInt(balanceResponse.toString());
  }
  
  return balance;
} 