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
    "Get the ETH balance for a Starknet address or Starknet ID",
    {
      address: z.string().describe("Starknet address or Starknet ID (with or without .stark)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ address, network = "mainnet" }) => {
      try {
        // Resolve address if it's a Starknet ID
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
    "Get the token balance for a Starknet address or Starknet ID",
    {
      tokenAddress: z.string().describe("Token contract address or Starknet ID"),
      ownerAddress: z.string().describe("Owner's Starknet address or Starknet ID"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ tokenAddress, ownerAddress, network = "mainnet" }) => {
      try {
        // Resolve addresses if they're Starknet IDs
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
  
  // Get STRK token balance
  server.tool(
    "get_starknet_strk_balance",
    "Get the STRK token balance for a Starknet address or Starknet ID",
    {
      address: z.string().describe("Starknet address or Starknet ID (with or without .stark)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ address, network = "mainnet" }) => {
      try {
        // Resolve address if it's a Starknet ID
        const resolvedAddress = await services.utils.resolveNameOrAddress(address, network);
        const balance = await services.getSTRKBalance(resolvedAddress, network);
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
  
  // Get all native token balances (ETH and STRK)
  server.tool(
    "get_starknet_native_balances",
    "Get all native token balances (ETH and STRK) for a Starknet address or Starknet ID",
    {
      address: z.string().describe("Starknet address or Starknet ID (with or without .stark)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ address, network = "mainnet" }) => {
      try {
        // Resolve address if it's a Starknet ID
        const resolvedAddress = await services.utils.resolveNameOrAddress(address, network);
        const balances = await services.getNativeTokenBalances(resolvedAddress, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(balances, (key, value) => 
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
    "Get the full Starknet ID profile for an address or Starknet ID",
    {
      address: z.string().describe("Starknet address or Starknet ID to lookup"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ address, network = "mainnet" }) => {
      try {
        // Resolve address if it's a Starknet ID
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
              typeof value === 'bigint' ? services.utils.toFelt(value) : value, 2)
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
            }, (key, value) => typeof value === 'bigint' ? services.utils.toFelt(value) : value, 2)
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
              typeof value === 'bigint' ? services.utils.toFelt(value) : value, 2)
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
              typeof value === 'bigint' ? services.utils.toFelt(value) : value, 2)
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
      contractAddress: z.string().describe("Contract address or Starknet ID"),
      entrypoint: z.string().describe("Function name to call"),
      calldata: z.array(z.string()).optional().describe("Call data array (optional)"),
      resultTypes: z.array(z.enum(['felt', 'uint256', 'address', 'string'])).optional().describe("Expected return types for each result value (e.g., ['felt', 'uint256', 'address'])"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ contractAddress, entrypoint, calldata = [], resultTypes, network = "mainnet" }) => {
      try {
        // Resolve contract address if it's a Starknet ID
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
              typeof value === 'bigint' ? services.utils.toFelt(value) : value, 2)
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
      contractAddress: z.string().describe("Contract address or Starknet ID"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ contractAddress, network = "mainnet" }) => {
      try {
        const provider = services.getProvider(network);
        
        // Resolve contract address if it's a Starknet ID
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
            }, (key, value) => typeof value === 'bigint' ? services.utils.toFelt(value) : value, 2)
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
      tokenAddress: z.string().describe("Token contract address or Starknet ID"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ tokenAddress, network = "mainnet" }) => {
      try {
        // Resolve token address if it's a Starknet ID
        const resolvedTokenAddress = await services.utils.resolveNameOrAddress(tokenAddress, network);
        
        const tokenInfo = await services.getTokenInfo(resolvedTokenAddress, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(tokenInfo, (key, value) => 
              typeof value === 'bigint' ? services.utils.toFelt(value) : value, 2)
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
  
  // Check NFT ownership
  server.tool(
    "check_starknet_nft_ownership",
    "Check if an address owns a specific NFT",
    {
      tokenAddress: z.string().describe("NFT contract address or Starknet ID"),
      tokenId: z.string().describe("Token ID to check"),
      ownerAddress: z.string().describe("Owner's Starknet address or Starknet ID to check against"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ tokenAddress, tokenId, ownerAddress, network = "mainnet" }) => {
      try {
        // Resolve addresses if they're Starknet IDs
        const resolvedTokenAddress = await services.utils.resolveNameOrAddress(tokenAddress, network);
        const resolvedOwnerAddress = await services.utils.resolveNameOrAddress(ownerAddress, network);
        
        const isOwner = await services.isNFTOwner(resolvedTokenAddress, tokenId, resolvedOwnerAddress, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              tokenAddress: resolvedTokenAddress,
              tokenId,
              ownerAddress: resolvedOwnerAddress,
              isOwner
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error checking NFT ownership: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get NFT balance (number of NFTs owned)
  server.tool(
    "get_starknet_nft_balance",
    "Get the number of NFTs owned by an address for a specific collection",
    {
      tokenAddress: z.string().describe("NFT contract address or Starknet ID"),
      ownerAddress: z.string().describe("Owner's Starknet address or Starknet ID"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ tokenAddress, ownerAddress, network = "mainnet" }) => {
      try {
        // Resolve addresses if they're Starknet IDs
        const resolvedTokenAddress = await services.utils.resolveNameOrAddress(tokenAddress, network);
        const resolvedOwnerAddress = await services.utils.resolveNameOrAddress(ownerAddress, network);
        
        const balance = await services.getERC721Balance(resolvedTokenAddress, resolvedOwnerAddress, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              tokenAddress: resolvedTokenAddress,
              ownerAddress: resolvedOwnerAddress,
              balance: balance.toString()
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error getting NFT balance: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get token total supply
  server.tool(
    "get_starknet_token_supply",
    "Get the total supply of a token",
    {
      tokenAddress: z.string().describe("Token contract address or Starknet ID"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ tokenAddress, network = "mainnet" }) => {
      try {
        // Resolve token address if it's a Starknet ID
        const resolvedTokenAddress = await services.utils.resolveNameOrAddress(tokenAddress, network);
        
        const supply = await services.getTokenTotalSupply(resolvedTokenAddress, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(supply, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error getting token supply: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Check transaction confirmation status
  server.tool(
    "check_starknet_transaction_status",
    "Check if a transaction is confirmed (finalized)",
    {
      txHash: z.string().describe("Transaction hash"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ txHash, network = "mainnet" }) => {
      try {
        const isConfirmed = await services.isTransactionConfirmed(txHash, network);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              txHash,
              isConfirmed
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error checking transaction status: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // TRANSFER TOOLS
  
  // Transfer ETH
  server.tool(
    "transfer_starknet_eth",
    "Transfer ETH from one account to another",
    {
      privateKey: z.string().describe("Private key of the sender account (not stored, only used to sign the transaction)"),
      from: z.string().describe("Sender's Starknet address"),
      to: z.string().describe("Recipient's Starknet address or Starknet ID"),
      amount: z.string().describe("Amount to transfer in ETH (human readable format, not wei)"),
      maxFee: z.string().optional().describe("Maximum fee to pay (optional)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ privateKey, from, to, amount, maxFee, network = "mainnet" }) => {
      try {
        const result = await services.transferETH({
          privateKey,
          from,
          to,
          amount, // Will be converted from human-readable ETH to wei internally
          maxFee
        }, network);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              txHash: result.txHash,
              message: "Transaction submitted successfully. Use get_starknet_transaction or check_starknet_transaction_status to check status."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error transferring ETH: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Transfer STRK
  server.tool(
    "transfer_starknet_strk",
    "Transfer STRK from one account to another",
    {
      privateKey: z.string().describe("Private key of the sender account (not stored, only used to sign the transaction)"),
      from: z.string().describe("Sender's Starknet address"),
      to: z.string().describe("Recipient's Starknet address or Starknet ID"),
      amount: z.string().describe("Amount to transfer in STRK (human readable format, not wei)"),
      maxFee: z.string().optional().describe("Maximum fee to pay (optional)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ privateKey, from, to, amount, maxFee, network = "mainnet" }) => {
      try {
        const result = await services.transferSTRK({
          privateKey,
          from,
          to,
          amount, // Will be converted from human-readable STRK to wei internally
          maxFee
        }, network);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              txHash: result.txHash,
              message: "Transaction submitted successfully. Use get_starknet_transaction or check_starknet_transaction_status to check status."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error transferring STRK: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Transfer ERC20 token
  server.tool(
    "transfer_starknet_token",
    "Transfer ERC20 tokens from one account to another",
    {
      privateKey: z.string().describe("Private key of the sender account (not stored, only used to sign the transaction)"),
      from: z.string().describe("Sender's Starknet address"),
      to: z.string().describe("Recipient's Starknet address or Starknet ID"),
      tokenAddress: z.string().describe("Token contract address or Starknet ID"),
      amount: z.string().describe("Amount to transfer in token's standard units (human readable format, not in smallest unit)"),
      maxFee: z.string().optional().describe("Maximum fee to pay (optional)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ privateKey, from, to, tokenAddress, amount, maxFee, network = "mainnet" }) => {
      try {
        const result = await services.transferERC20({
          privateKey,
          from,
          to,
          tokenAddress,
          amount, // Will be converted from human-readable token units to smallest units internally
          maxFee
        }, network);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              txHash: result.txHash,
              message: "Transaction submitted successfully. Use get_starknet_transaction or check_starknet_transaction_status to check status."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error transferring tokens: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Execute contract call
  server.tool(
    "execute_starknet_contract",
    "Execute a contract call (write operation)",
    {
      privateKey: z.string().describe("Private key of the sender account (not stored, only used to sign the transaction)"),
      accountAddress: z.string().describe("Sender's Starknet address"),
      contractAddress: z.string().describe("Contract address or Starknet ID"),
      entrypoint: z.string().describe("Function name to call"),
      calldata: z.array(z.string()).optional().describe("Call data array (optional)"),
      maxFee: z.string().optional().describe("Maximum fee to pay (optional)"),
      network: z.string().optional().describe("Network name (e.g., 'mainnet', 'sepolia'). Defaults to Mainnet.")
    },
    async ({ privateKey, accountAddress, contractAddress, entrypoint, calldata, maxFee, network = "mainnet" }) => {
      try {
        const result = await services.executeContract({
          privateKey,
          accountAddress,
          contractAddress,
          entrypoint,
          calldata,
          maxFee
        }, network);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              txHash: result.txHash,
              message: "Transaction submitted successfully. Use get_starknet_transaction or check_starknet_transaction_status to check status."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error executing contract: ${error.message || "Unknown error occurred"}`
          }],
          isError: true
        };
      }
    }
  );
}