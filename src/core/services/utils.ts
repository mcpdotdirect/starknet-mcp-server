import { hash, num, shortString, validateAndParseAddress } from 'starknet';
import { uint256 } from 'starknet';
import { getProvider } from './clients.js';

/**
 * Utility functions for Starknet
 */
export const utils = {
  /**
   * Convert a number to a felt (field element) hex string
   * @param value The number to convert
   */
  toFelt(value: string | number | bigint): string {
    return num.toHex(value);
  },
  
  /**
   * Convert a felt (field element) to a number
   * @param felt The felt to convert
   */
  fromFelt(felt: string): bigint {
    return num.toBigInt(felt);
  },
  
  /**
   * Convert a string to a felt (field element)
   * @param value The string to convert
   */
  stringToFelt(value: string): string {
    return shortString.encodeShortString(value);
  },
  
  /**
   * Convert a felt (field element) to a string
   * @param felt The felt to convert
   */
  feltToString(felt: string): string {
    return shortString.decodeShortString(felt);
  },
  
  /**
   * Convert a BigInt to a hex string representation of a felt
   * This is useful for contract addresses returned from contracts
   * @param value BigInt value to convert
   */
  bigintToHex(value: bigint): string {
    return '0x' + value.toString(16);
  },

  /**
   * Format a BigInt value to a Starknet-compatible hex address
   * Useful for contract addresses returned from function calls
   * @param value BigInt value to format as address
   */
  formatAddress(value: bigint | string): string {
    if (typeof value === 'string') {
      return value.startsWith('0x') ? value : `0x${value}`;
    }
    return '0x' + value.toString(16).padStart(64, '0');
  },
  
  /**
   * Compute the starknet keccak hash of a string
   * @param value The string to hash
   */
  hashMessage(value: string): string {
    return hash.starknetKeccak(value).toString();
  },
  
  /**
   * Check if an address is valid
   * @param address The address to check
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
   * Resolve a StarkNet ID name to an address or return the address if already valid
   * @param nameOrAddress StarkNet name (starknet.id) or address
   * @param network Network name (mainnet, goerli, sepolia)
   * @returns The resolved address
   * @throws Error if name cannot be resolved or address is invalid
   */
  async resolveNameOrAddress(nameOrAddress: string, network = 'mainnet'): Promise<string> {
    // If it's already a valid address, return it
    if (this.isValidAddress(nameOrAddress)) {
      return nameOrAddress;
    }
    
    // If it's not a valid address, try to resolve it as a StarkNet ID
    // Check if it has a .stark suffix, if not add it
    const name = nameOrAddress.endsWith('.stark') ? nameOrAddress : `${nameOrAddress}.stark`;
    
    try {
      const provider = getProvider(network);
      const address = await provider.getAddressFromStarkName(name);
      
      if (!address || address === '0x0') {
        throw new Error(`Could not resolve StarkNet ID: ${name}`);
      }
      
      return address;
    } catch (error) {
      throw new Error(`Invalid address or unresolvable StarkNet ID: ${nameOrAddress}`);
    }
  },

  /**
   * Calculate a contract address
   * @param salt A random salt
   * @param classHash The class hash
   * @param constructorCalldata The constructor calldata
   * @param deployerAddress The deployer address
   */
  calculateContractAddress(
    salt: string,
    classHash: string,
    constructorCalldata: string[] = [],
    deployerAddress?: string
  ): string {
    return hash.calculateContractAddressFromHash(
      salt,
      classHash,
      constructorCalldata,
      deployerAddress || '0x0'
    );
  },
  
  /**
   * Split a uint256 into low and high parts
   * @param value The uint256 value
   */
  splitUint256(value: bigint): { low: string; high: string } {
    const low = '0x' + (value & BigInt('0xffffffffffffffffffffffffffffffff')).toString(16);
    const high = '0x' + ((value >> BigInt(128)) & BigInt('0xffffffffffffffffffffffffffffffff')).toString(16);
    return { low, high };
  },
  
  /**
   * Combine low and high parts into a uint256
   * @param low The low part
   * @param high The high part
   */
  combineUint256(low: string, high: string): bigint {
    const lowBigInt = BigInt(low);
    const highBigInt = BigInt(high);
    return lowBigInt + (highBigInt << BigInt(128));
  },

  /**
   * Convert a BigInt to a Starknet uint256 representation
   * Important when writing to contracts that expect uint256
   * @param value The BigInt value to convert
   */
  bigintToUint256(value: bigint): { low: string; high: string } {
    const uint = uint256.bnToUint256(value);
    return {
      low: uint.low.toString(),
      high: uint.high.toString()
    };
  },

  /**
   * Convert a Starknet uint256 to a BigInt
   * Useful when reading uint256 values from contracts
   * @param uint The uint256 object or components
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
   * @param type The expected type ('felt', 'uint256', 'address')
   */
  formatContractValue(value: any, type: 'felt' | 'uint256' | 'address' | 'string' = 'felt'): string | bigint | { low: string; high: string } {
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
        if (typeof value === 'bigint' || (!isNaN(Number(value)) && /^[0-9]+$/.test(value.toString()))) {
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
  }
}; 