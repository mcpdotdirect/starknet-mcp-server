import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupportedNetworks, getRpcUrl, getChainId } from "./chains.js";
import * as services from "./services/index.js";

/**
 * Register all Starknet-related tools with the MCP server
 * 
 * @param server The MCP server instance
 */
export function registerTools(server: McpServer) {
  // NETWORK INFORMATION TOOLS
  
  // Get chain information
  server.tool(
    "get_starknet_chain_info",
    "Get information about a Starknet network",
    {
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ network = "mainnet" }) => {
      try {
        const blockNumber = await services.getBlockNumber(network);
        const rpcUrl = getRpcUrl(network);
        const chainId = getChainId(network);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              network,
              chainId,
              blockNumber,
              rpcUrl
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get supported networks
  server.tool(
    "get_supported_starknet_networks",
    "Get a list of supported Starknet networks",
    {},
    async () => {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            networks: getSupportedNetworks()
          }, null, 2)
        }]
      };
    }
  );
  
  // BALANCE TOOLS
  
  // Get ETH balance
  server.tool(
    "get_starknet_eth_balance",
    "Get the ETH balance for a Starknet address or StarkNet ID",
    {
      address: z.string().describe("Starknet address or StarkNet ID (with or without .stark)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ address, network = "mainnet" }) => {
      try {
        // Resolve address if it's a StarkNet ID
        const resolvedAddress = await services.utils.resolveNameOrAddress(address, network);
        const balance = await services.getETHBalance(resolvedAddress, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(balance, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get ERC20 token balance
  server.tool(
    "get_starknet_token_balance",
    "Get the token balance for a Starknet address or StarkNet ID",
    {
      tokenAddress: z.string().describe("Token contract address or StarkNet ID"),
      ownerAddress: z.string().describe("Owner's Starknet address or StarkNet ID"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ tokenAddress, ownerAddress, network = "mainnet" }) => {
      try {
        // Resolve addresses if they're StarkNet IDs
        const resolvedTokenAddress = await services.utils.resolveNameOrAddress(tokenAddress, network);
        const resolvedOwnerAddress = await services.utils.resolveNameOrAddress(ownerAddress, network);
        
        const balance = await services.getERC20Balance(resolvedTokenAddress, resolvedOwnerAddress, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(balance, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // STARKNET ID TOOLS
  
  // Resolve address to Starknet ID
  server.tool(
    "resolve_starknet_name",
    "Get the Starknet ID for an address",
    {
      address: z.string().describe("Starknet address to lookup (must be a valid address, not a name)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const starknetId = await services.getStarkName(address, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              starknetId: starknetId || null,
              hasStarknetId: !!starknetId
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error resolving Starknet ID: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Resolve Starknet ID to address
  server.tool(
    "resolve_starknet_address",
    "Get the address for a Starknet ID",
    {
      name: z.string().describe("Starknet ID to lookup (with or without .stark)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ name, network = "mainnet" }) => {
      try {
        // Add .stark if not present
        const fullName = name.endsWith('.stark') ? name : `${name}.stark`;
        const address = await services.getAddressFromStarkName(fullName, network);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              starknetId: fullName,
              address: address || null,
              resolved: !!address
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error resolving address: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get full Starknet profile
  server.tool(
    "get_starknet_profile",
    "Get the full Starknet ID profile for an address or StarkNet ID",
    {
      address: z.string().describe("Starknet address or StarkNet ID to lookup"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ address, network = "mainnet" }) => {
      try {
        // Resolve address if it's a StarkNet ID
        const resolvedAddress = await services.utils.resolveNameOrAddress(address, network);
        
        const profile = await services.getStarkProfile(resolvedAddress, network);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profile, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error getting Starknet profile: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Validate Starknet ID
  server.tool(
    "validate_starknet_domain",
    "Check if a string is a valid Starknet ID",
    {
      domain: z.string().describe("Starknet ID to validate (with or without .stark)")
    },
    async ({ domain }) => {
      const isValid = services.isValidStarknetDomain(domain);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            domain,
            isValid
          }, null, 2)
        }]
      };
    }
  );
  
  // BLOCK TOOLS
  
  // Get block info
  server.tool(
    "get_starknet_block",
    "Get information about a specific block",
    {
      blockIdentifier: z.string().optional().describe("Block number, hash, or 'latest'/'pending'. Defaults to 'latest'."),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ blockIdentifier = "latest", network = "mainnet" }) => {
      try {
        const block = await services.getBlock(blockIdentifier, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(block, (key, value) => 
              typeof value === 'bigint' ? services.helpers.toFelt(value) : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get block transactions
  server.tool(
    "get_starknet_block_transactions",
    "Get transactions in a specific block",
    {
      blockIdentifier: z.string().optional().describe("Block number, hash, or 'latest'/'pending'. Defaults to 'latest'."),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ blockIdentifier = "latest", network = "mainnet" }) => {
      try {
        const transactions = await services.getBlockTransactions(blockIdentifier, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              blockIdentifier,
              transactions
            }, (key, value) => typeof value === 'bigint' ? services.helpers.toFelt(value) : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // TRANSACTION TOOLS
  
  // Get transaction
  server.tool(
    "get_starknet_transaction",
    "Get details about a transaction",
    {
      txHash: z.string().describe("Transaction hash"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ txHash, network = "mainnet" }) => {
      try {
        const transaction = await services.getTransaction(txHash, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(transaction, (key, value) => 
              typeof value === 'bigint' ? services.helpers.toFelt(value) : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get transaction receipt
  server.tool(
    "get_starknet_transaction_receipt",
    "Get transaction receipt",
    {
      txHash: z.string().describe("Transaction hash"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ txHash, network = "mainnet" }) => {
      try {
        const receipt = await services.getTransactionReceipt(txHash, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(receipt, (key, value) => 
              typeof value === 'bigint' ? services.helpers.toFelt(value) : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // CONTRACT TOOLS
  
  // Call contract
  server.tool(
    "call_starknet_contract",
    "Call a read-only function on a contract",
    {
      contractAddress: z.string().describe("Contract address or StarkNet ID"),
      entrypoint: z.string().describe("Function name to call"),
      calldata: z.array(z.string()).optional().describe("Call data array (optional)"),
      resultTypes: z.array(z.enum(['felt', 'uint256', 'address', 'string'])).optional().describe("Expected return types for each result value (e.g., ['felt', 'uint256', 'address'])"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ contractAddress, entrypoint, calldata = [], resultTypes, network = "mainnet" }) => {
      try {
        // Resolve contract address if it's a StarkNet ID
        const resolvedContractAddress = await services.utils.resolveNameOrAddress(contractAddress, network);
        
        const rawResult = await services.callContract({
          contractAddress: resolvedContractAddress,
          entrypoint,
          calldata
        }, network);
        
        // Format the result based on expected types if provided
        const formattedResult = resultTypes 
          ? services.formatCallResult(rawResult, resultTypes)
          : rawResult;
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              result: formattedResult
            }, (key, value) => 
              typeof value === 'bigint' ? services.helpers.toFelt(value) : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get contract class
  server.tool(
    "get_starknet_contract_class",
    "Get the class (ABI and other information) of a contract",
    {
      contractAddress: z.string().describe("Contract address or StarkNet ID"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ contractAddress, network = "mainnet" }) => {
      try {
        const provider = services.getProvider(network);
        
        // Resolve contract address if it's a StarkNet ID
        const resolvedContractAddress = await services.utils.resolveNameOrAddress(contractAddress, network);
        const formattedAddress = services.parseStarknetAddress(resolvedContractAddress);
        
        const classHash = await provider.getClassHashAt(formattedAddress, 'latest');
        const contractClass = await provider.getClass(classHash, 'latest');
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              classHash,
              contractClass
            }, (key, value) => typeof value === 'bigint' ? services.helpers.toFelt(value) : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // TOKEN TOOLS
  
  // Get token info
  server.tool(
    "get_starknet_token_info",
    "Get information about a token",
    {
      tokenAddress: z.string().describe("Token contract address or StarkNet ID"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ tokenAddress, network = "mainnet" }) => {
      try {
        // Resolve token address if it's a StarkNet ID
        const resolvedTokenAddress = await services.utils.resolveNameOrAddress(tokenAddress, network);
        
        const tokenInfo = await services.getTokenInfo(resolvedTokenAddress, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(tokenInfo, (key, value) => 
              typeof value === 'bigint' ? services.helpers.toFelt(value) : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
}