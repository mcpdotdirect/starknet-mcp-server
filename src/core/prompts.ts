import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register all Starknet-related prompts with the MCP server
 * @param server The MCP server instance
 */
export function registerPrompts(server: McpServer) {
  // Basic block explorer prompt
  server.prompt(
    "explore_starknet_block",
    "Explore information about a specific Starknet block",
    {
      blockNumber: z.string().optional().describe("Block number to explore. If not provided, latest block will be used."),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    ({ blockNumber, network = "mainnet" }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `I want to explore the Starknet blockchain. Please give me detailed information about ${blockNumber ? `block #${blockNumber}` : "the latest block"} on the ${network} network. Include data like timestamp, transactions count, and any other interesting metrics.`
        }
      }]
    })
  );
  
  // Address information prompt
  server.prompt(
    "explore_starknet_address",
    "Get information about a Starknet address",
    {
      address: z.string().describe("Starknet address to explore"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    ({ address, network = "mainnet" }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `I'm researching the Starknet address ${address} on the ${network} network. Please provide me with detailed information about this address, including its ETH balance, any token balances if available, and transaction history if possible. Also check if it has a Starknet ID associated with it. Summarize what you find about this address.`
        }
      }]
    })
  );
  
  // Transaction information prompt
  server.prompt(
    "explore_starknet_transaction",
    "Get information about a Starknet transaction",
    {
      txHash: z.string().describe("Transaction hash to explore"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    ({ txHash, network = "mainnet" }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `I'm analyzing Starknet transaction ${txHash} on the ${network} network. Please provide me with detailed information about this transaction, including its status, block confirmation, timestamp, gas used, and any other relevant details. Also explain what this transaction did in plain language.`
        }
      }]
    })
  );
  
  // Starknet ID lookup prompt
  server.prompt(
    "lookup_starknet_id",
    "Look up a Starknet ID or resolve an address to a Starknet ID",
    {
      identifier: z.string().describe("Either a Starknet ID (with or without .stark) or a Starknet address"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    ({ identifier, network = "mainnet" }) => {
      // Determine if this is an address or a Starknet ID
      const isLikelyAddress = identifier.startsWith('0x') || /^[0-9a-fA-F]{64}$/.test(identifier);
      
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: isLikelyAddress 
              ? `Please lookup the Starknet ID associated with the address ${identifier} on the ${network} network. If there's a profile available, provide details about it.`
              : `Please resolve the Starknet ID "${identifier}" to an address on the ${network} network. If this is a valid ID, provide information about the associated address.`
          }
        }]
      };
    }
  );
  
  // Starknet ID profile prompt
  server.prompt(
    "explore_starknet_id_profile",
    "Explore a full Starknet ID profile",
    {
      address: z.string().describe("Starknet address to look up the profile for"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    ({ address, network = "mainnet" }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `I'd like to explore the Starknet ID profile for address ${address} on the ${network} network. Please provide all available information, including the ID, profile picture, verifications, and any other associated data. Let me know if this address has a verified profile and what it can be used for.`
        }
      }]
    })
  );
} 