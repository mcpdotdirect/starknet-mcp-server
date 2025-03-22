import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupportedNetworks, getRpcUrl } from "./chains.js";
import * as services from "./services/index.js";

/**
 * Register all Starknet resources
 * @param server The MCP server instance
 */
export function registerResources(server: McpServer) {
  // Get Starknet info for a specific network
  server.resource(
    "starknet_chain_info_by_network", 
    new ResourceTemplate("starknet://{network}/chain", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const provider = services.getProvider(network);
        const blockNumber = await services.getBlockNumber(network);
        const rpcUrl = getRpcUrl(network);
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              network,
              blockNumber,
              rpcUrl
            }, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
  
  // Get a list of all supported networks
  server.resource(
    "starknet_networks", 
    new ResourceTemplate("starknet://networks", { list: undefined }),
    async (uri) => {
      try {
        const networks = getSupportedNetworks();
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              networks
            }),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
  
  // Get block information
  server.resource(
    "starknet_block_by_id_or_hash", 
    new ResourceTemplate("starknet://{network}/block/{blockIdentifier}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const blockIdentifier = params.blockIdentifier as string;
        
        const block = await services.getBlock(blockIdentifier, network);
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify(block, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
  
  // Get latest block
  server.resource(
    "starknet_latest_block", 
    new ResourceTemplate("starknet://{network}/block/latest", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        
        const block = await services.getBlock('latest', network);
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify(block, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
  
  // Get address information
  server.resource(
    "starknet_address", 
    new ResourceTemplate("starknet://{network}/address/{address}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const address = params.address as string;
        
        // Try to resolve the address if it's a Starknet ID
        const resolvedAddress = await services.utils.resolveNameOrAddress(address, network);
        const ethBalance = await services.getETHBalance(resolvedAddress, network);
        const provider = services.getProvider(network);
        
        // Get class hash and class
        const classHash = await provider.getClassHashAt(resolvedAddress, 'latest');
        const contractClass = await provider.getClass(classHash, 'latest');
        
        // Get Starknet ID if available
        const starknetId = await services.getStarkName(resolvedAddress, network);
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              address: resolvedAddress,
              ethBalance,
              classHash,
              contractType: contractClass.abi ? "Contract" : "EOA",
              starknetId: starknetId || null,
              hasStarknetId: !!starknetId
            }, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
  
  // Get transaction information
  server.resource(
    "starknet_transaction", 
    new ResourceTemplate("starknet://{network}/tx/{txHash}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const txHash = params.txHash as string;
        
        const [transaction, receipt] = await Promise.all([
          services.getTransaction(txHash, network),
          services.getTransactionReceipt(txHash, network)
        ]);
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              transaction,
              receipt
            }, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
  
  // STARKNET ID RESOURCES
  
  // Resolve a Starknet address to a Starknet ID
  server.resource(
    "starknet_address_to_id", 
    new ResourceTemplate("starknet://{network}/id/address/{address}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const address = params.address as string;
        
        const starknetId = await services.getStarkName(address, network);
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              address,
              starknetId: starknetId || null,
              hasStarknetId: !!starknetId
            }),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
  
  // Resolve a Starknet ID to an address
  server.resource(
    "starknet_id_to_address", 
    new ResourceTemplate("starknet://{network}/id/name/{name}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const name = params.name as string;
        
        // Ensure name ends with .stark
        const fullName = name.endsWith('.stark') ? name : `${name}.stark`;
        
        const address = await services.getAddressFromStarkName(fullName, network);
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              starknetId: fullName,
              address: address || null,
              resolved: !!address
            }),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
  
  // Get full Starknet ID profile
  server.resource(
    "starknet_id_profile", 
    new ResourceTemplate("starknet://{network}/id/profile/{address}", { list: undefined }),
    async (uri, params) => {
      try {
        const network = params.network as string;
        const address = params.address as string;
        
        // Try to resolve the address if it's a Starknet ID
        const resolvedAddress = await services.utils.resolveNameOrAddress(address, network);
        const profile = await services.getStarkProfile(resolvedAddress, network);
        
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify(profile || {
              address: resolvedAddress,
              id: null
            }, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value),
            mimeType: "application/json"
          }]
        };
      } catch (error: any) {
        return {
          contents: [{
            uri: uri.toString(),
            text: JSON.stringify({
              error: error.message || String(error)
            }),
            mimeType: "application/json"
          }]
        };
      }
    }
  );
} 