import { hash, num, shortString, validateAndParseAddress } from 'starknet';
import { uint256, constants } from 'starknet';
import { getProvider } from './clients.js';

// Map of network names to chain IDs for cleaner code
const CHAIN_IDS = {
  mainnet: constants.StarknetChainId.SN_MAIN,
  sepolia: constants.StarknetChainId.SN_SEPOLIA
};

/**
 * Utility functions for Starknet
 */
export const utils = {
  /**
   * Convert a number to a felt (field element) hex string
   * @param value The number to convert
   * @returns Hex string representation
   */
  toFelt(value: string | number | bigint): string {
    return num.toHex(value);
  },
  
  /**
   * Convert a felt (field element) to a number
   * @param felt The felt to convert
   * @returns BigInt value
   */
  fromFelt(felt: string): bigint {
    return num.toBigInt(felt);
  },
  
  /**
   * Convert a string to a felt (field element)
   * @param value The string to convert
   * @returns Felt representation of the string
   */
  stringToFelt(value: string): string {
    return shortString.encodeShortString(value);
  },
  
  /**
   * Convert a felt (field element) to a string
   * @param felt The felt to convert
   * @returns Decoded string
   */
  feltToString(felt: string): string {
    try {
      return shortString.decodeShortString(felt);
    } catch (error) {
      console.error('Error decoding felt to string:', error);
      return String(felt); // Fallback to simple string conversion
    }
  },
  
  /**
   * Convert a BigInt to a hex string representation of a felt
   * This is useful for contract addresses returned from contracts
   * @param value BigInt value to convert
   * @returns Hex string
   */
  bigintToHex(value: bigint): string {
    return '0x' + value.toString(16);
  },

  /**
   * Format a BigInt value to a Starknet-compatible hex address
   * Useful for contract addresses returned from function calls
   * @param value BigInt value or string to format as address
   * @returns Formatted address string
   */
  formatAddress(value: bigint | string): string {
    try {
      if (typeof value === 'string') {
        return value.startsWith('0x') ? value : `0x${value}`;
      }
      return '0x' + value.toString(16).padStart(64, '0');
    } catch (error) {
      throw new Error(`Invalid address value: ${value}`);
    }
  },
  
  /**
   * Compute the starknet keccak hash of a string
   * @param value The string to hash
   * @returns Hash as string
   */
  hashMessage(value: string): string {
    return hash.starknetKeccak(value).toString();
  },
  
  /**
   * Check if an address is valid
   * @param address The address to check
   * @returns True if valid
   */
  isValidAddress(address: string): boolean {
    try {
      validateAndParseAddress(address);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Resolve a Starknet ID name to an address or return the address if already valid
   * @param nameOrAddress Starknet name (starknet.id) or address
   * @param network Network name (mainnet, sepolia)
   * @returns The resolved address
   * @throws Error if name cannot be resolved or address is invalid
   */
  async resolveNameOrAddress(nameOrAddress: string, network = 'mainnet'): Promise<string> {
    // If it's already a valid address, return it
    if (this.isValidAddress(nameOrAddress)) {
      return nameOrAddress;
    }
    
    try {
      // Import StarknetIdNavigator dynamically to avoid circular dependencies
      const { StarknetIdNavigator, utils: starknetIdUtils } = await import('starknetid.js');
      
      // Get provider
      const provider = getProvider(network);
      
      // Get chain ID from map, defaulting to mainnet if not found
      const chainId = CHAIN_IDS[network as keyof typeof CHAIN_IDS] || CHAIN_IDS.mainnet;
      
      // Create StarknetIdNavigator instance
      const navigator = new StarknetIdNavigator(provider, chainId);
      
      // Check if it's a valid Starknet domain
      if (starknetIdUtils.isStarkDomain(nameOrAddress)) {
        // Make sure it has .stark suffix
        const name = nameOrAddress.endsWith('.stark') ? nameOrAddress : `${nameOrAddress}.stark`;
        const address = await navigator.getAddressFromStarkName(name);
        
        if (!address || address === '0x0') {
          throw new Error(`Could not resolve Starknet ID: ${name}`);
        }
        
        return address;
      }
      
      throw new Error(`Invalid address or unresolvable Starknet ID: ${nameOrAddress}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error resolving name or address: ${errorMessage}`);
    }
  },

  /**
   * Calculate a contract address
   * @param salt A random salt
   * @param classHash The class hash
   * @param constructorCalldata The constructor calldata
   * @param deployerAddress The deployer address
   * @returns Calculated contract address
   */
  calculateContractAddress(
    salt: string,
    classHash: string,
    constructorCalldata: string[] = [],
    deployerAddress?: string
  ): string {
    try {
      return hash.calculateContractAddressFromHash(
        salt,
        classHash,
        constructorCalldata,
        deployerAddress || '0x0'
      );
    } catch (error) {
      throw new Error(`Error calculating contract address: ${(error as Error).message}`);
    }
  },
  
  /**
   * Split a uint256 into low and high parts
   * @param value The uint256 value
   * @returns Object with low and high parts as hex strings
   */
  splitUint256(value: bigint): { low: string; high: string } {
    try {
      // Use StarknetJS's uint256.bnToUint256 for proper conversion
      const result = uint256.bnToUint256(value);
      // Convert the result to the expected string format
      return { 
        low: result.low.toString(), 
        high: result.high.toString() 
      };
    } catch (error) {
      // Fallback to manual calculation if StarknetJS function fails
      const low = '0x' + (value & BigInt('0xffffffffffffffffffffffffffffffff')).toString(16);
      const high = '0x' + ((value >> BigInt(128)) & BigInt('0xffffffffffffffffffffffffffffffff')).toString(16);
      return { low, high };
    }
  },
  
  /**
   * Combine low and high parts into a uint256
   * @param low The low part
   * @param high The high part
   * @returns Combined BigInt value
   */
  combineUint256(low: string, high: string): bigint {
    try {
      return uint256.uint256ToBN({ low, high });
    } catch (error) {
      // Fallback to manual calculation if StarknetJS function fails
      const lowBigInt = BigInt(low);
      const highBigInt = BigInt(high);
      return lowBigInt + (highBigInt << BigInt(128));
    }
  },

  /**
   * Convert a BigInt to a Starknet uint256 representation
   * Important when writing to contracts that expect uint256
   * @param value The BigInt value to convert
   * @returns Object with low and high parts
   */
  bigintToUint256(value: bigint): { low: string; high: string } {
    const result = uint256.bnToUint256(value);
    // Convert the result to the expected string format
    return { 
      low: result.low.toString(), 
      high: result.high.toString() 
    };
  },

  /**
   * Convert a Starknet uint256 to a BigInt
   * Useful when reading uint256 values from contracts
   * @param uint The uint256 object or components
   * @returns BigInt value
   */
  uint256ToBigint(uint: { low: string; high: string } | string[]): bigint {
    if (Array.isArray(uint)) {
      return uint256.uint256ToBN({ low: uint[0], high: uint[1] });
    }
    return uint256.uint256ToBN(uint);
  },

  /**
   * Format a numeric value returned from a contract
   * This will determine the appropriate format based on the expected type
   * @param value The value returned from the contract
   * @param type The expected type ('felt', 'uint256', 'address', 'string')
   * @returns Formatted value according to the specified type
   */
  formatContractValue(
    value: any, 
    type: 'felt' | 'uint256' | 'address' | 'string' = 'felt'
  ): string | bigint | { low: string; high: string } {
    try {
      if (type === 'uint256') {
        // If already uint256 format with low/high, return as is
        if (typeof value === 'object' && 'low' in value && 'high' in value) {
          return value;
        }
        // If array with two elements (low, high), convert to uint256 object
        if (Array.isArray(value) && value.length === 2) {
          return { low: value[0].toString(), high: value[1].toString() };
        }
        // If bigint or can be converted to bigint, convert to uint256
        return this.bigintToUint256(BigInt(value.toString()));
      } else if (type === 'address') {
        // Format as proper Starknet address
        return this.formatAddress(value.toString());
      } else if (type === 'string') {
        // Try to convert to string if it's encoded as a felt
        try {
          if (typeof value === 'bigint' || 
              (!isNaN(Number(value)) && /^[0-9]+$/.test(value.toString())) || 
              (typeof value === 'string' && value.startsWith('0x'))) {
            return this.feltToString(this.toFelt(value));
          }
          return value.toString();
        } catch {
          return value.toString();
        }
      } else {
        // Default felt handling
        return this.toFelt(value);
      }
    } catch (error) {
      console.error(`Error formatting contract value (${type}):`, error);
      return String(value); // Fallback to simple string conversion
    }
  }
}; 