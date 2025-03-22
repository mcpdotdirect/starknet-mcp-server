/**
 * Defines supported Starknet networks with their RPC URLs
 */
import { constants } from 'starknet';

export type NetworkConfig = {
  name: string;
  chainId: string;
  rpcUrl: string;
};

// Network configurations
const networks: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    chainId: constants.StarknetChainId.SN_MAIN,
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io'
  },
  sepolia: {
    name: 'sepolia',
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    rpcUrl: 'https://starknet-sepolia.public.blastapi.io'
  }
};

// Default network to use if none specified
export const DEFAULT_NETWORK = 'mainnet';

/**
 * Get the network configuration for a given network name
 * @param networkName The network name (mainnet, sepolia)
 * @returns The network configuration
 */
export function getNetwork(networkName: string = DEFAULT_NETWORK): NetworkConfig {
  const network = networks[networkName.toLowerCase()];
  
  if (!network) {
    throw new Error(`Network ${networkName} not supported. Available networks: ${Object.keys(networks).join(', ')}`);
  }
  
  return network;
}

/**
 * Get the RPC URL for a given network
 * @param networkName The network name
 * @returns The RPC URL for the network
 */
export function getRpcUrl(networkName: string = DEFAULT_NETWORK): string {
  return getNetwork(networkName).rpcUrl;
}

/**
 * Get the chain ID for a given network
 * @param networkName The network name
 * @returns The chain ID for the network
 */
export function getChainId(networkName: string = DEFAULT_NETWORK): string {
  return getNetwork(networkName).chainId;
}

/**
 * Get a list of all supported networks
 * @returns Array of network names
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(networks);
} 