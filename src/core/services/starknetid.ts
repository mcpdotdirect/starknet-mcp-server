import { constants } from 'starknet';
import { StarknetIdNavigator, type StarkProfile as StarknetIdProfile } from 'starknetid.js';
import { getProvider } from './clients.js';

/**
 * Represents a Starknet profile with all its data
 */
export interface StarkProfile {
  id?: bigint;
  starknetId?: string;
  address: string;
  profilePicture?: string;
  verifications?: Record<string, boolean>;
  proofOfPersonhood?: boolean;
}

// Cache for StarknetIdNavigator instances to avoid recreating them for each request
const navigatorCache = new Map<string, StarknetIdNavigator>();

/**
 * Get a StarknetIdNavigator instance for a specific network
 * @param network Network name (mainnet, sepolia)
 * @returns StarknetIdNavigator instance
 */
function getStarknetIdNavigator(network = 'mainnet'): StarknetIdNavigator {
  const cacheKey = network;
  
  // Return cached navigator if available
  if (navigatorCache.has(cacheKey)) {
    return navigatorCache.get(cacheKey)!;
  }
  
  // Create a new navigator
  const provider = getProvider(network);
  
  // Map network name to Starknet.js chain ID constants
  let chainId;
  if (network === 'mainnet') {
    chainId = constants.StarknetChainId.SN_MAIN;
  } else if (network === 'sepolia') {
    chainId = constants.StarknetChainId.SN_SEPOLIA;
  } else {
    // Default to mainnet if network is unknown
    chainId = constants.StarknetChainId.SN_MAIN;
  }
  
  const navigator = new StarknetIdNavigator(provider, chainId);
  
  // Cache the navigator
  navigatorCache.set(cacheKey, navigator);
  
  return navigator;
}

/**
 * Get the Starknet ID for a given address
 * @param address The Starknet address to lookup
 * @param network Network name (mainnet, sepolia)
 * @returns The Starknet ID or empty string if not found
 */
export async function getStarkName(
  address: string,
  network = 'mainnet'
): Promise<string> {
  try {
    const navigator = getStarknetIdNavigator(network);
    return await navigator.getStarkName(address) || '';
  } catch (error) {
    console.error('Error getting Starknet ID:', error);
    return '';
  }
}

/**
 * Get the address for a given Starknet ID
 * @param name The Starknet ID to lookup
 * @param network Network name (mainnet, sepolia)
 * @returns The Starknet address or empty string if not found
 */
export async function getAddressFromStarkName(
  name: string,
  network = 'mainnet'
): Promise<string> {
  try {
    const navigator = getStarknetIdNavigator(network);
    return await navigator.getAddressFromStarkName(name) || '';
  } catch (error) {
    console.error('Error getting address from Starknet ID:', error);
    return '';
  }
}

/**
 * Get detailed profile information for a Starknet address
 * @param address The Starknet address to lookup
 * @param network Network name (mainnet, sepolia)
 * @returns The Starknet profile data or null if not found
 */
export async function getStarkProfile(
  address: string,
  network = 'mainnet'
): Promise<StarkProfile | null> {
  try {
    const navigator = getStarknetIdNavigator(network);
    const profileData = await navigator.getProfileData(address);
    
    if (!profileData) {
      return null;
    }
    
    // Convert from StarknetId's profile format to our format
    return {
      address,
      starknetId: profileData.name,
      profilePicture: profileData.profilePicture,
      verifications: {
        twitter: !!profileData.twitter,
        github: !!profileData.github,
        discord: !!profileData.discord
      },
      proofOfPersonhood: profileData.proofOfPersonhood || false
    };
  } catch (error) {
    console.error('Error getting Starknet profile:', error);
    return null;
  }
}

/**
 * Check if a string is a valid Starknet domain
 * @param domain The domain to check (with or without .stark)
 * @returns True if it's a valid Starknet domain
 */
export function isValidStarknetDomain(domain: string): boolean {
  const { utils } = require('starknetid.js');
  return utils.isStarkDomain(domain);
}

/**
 * Get the Starknet ID contract address based on network
 * @param network Network name (mainnet, sepolia)
 * @returns Contract address
 */
export function getStarknetIdContract(network = 'mainnet'): string {
  const { utils } = require('starknetid.js');
  
  // Map network name to Starknet.js chain ID constants
  let chainId;
  if (network === 'mainnet') {
    chainId = constants.StarknetChainId.SN_MAIN;
  } else if (network === 'sepolia') {
    chainId = constants.StarknetChainId.SN_SEPOLIA;
  } else {
    // Default to mainnet if network is unknown
    chainId = constants.StarknetChainId.SN_MAIN;
  }
  
  return utils.getNamingContract(chainId);
}

/**
 * Get the Starknet ID identity contract address based on network
 * @param network Network name (mainnet, sepolia)
 * @returns Contract address
 */
export function getStarknetIdIdentityContract(network = 'mainnet'): string {
  const { utils } = require('starknetid.js');
  
  // Map network name to Starknet.js chain ID constants
  let chainId;
  if (network === 'mainnet') {
    chainId = constants.StarknetChainId.SN_MAIN;
  } else if (network === 'sepolia') {
    chainId = constants.StarknetChainId.SN_SEPOLIA;
  } else {
    // Default to mainnet if network is unknown
    chainId = constants.StarknetChainId.SN_MAIN;
  }
  
  return utils.getIdentityContract(chainId);
} 