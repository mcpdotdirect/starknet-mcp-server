import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as services from "./services/index.js";

/**
 * Register all resources with the MCP server
 * @param server The MCP server instance
 */
export function registerResources(server: McpServer) {
  // Example resource
  server.resource(
    "example_resource", 
    "example://{id}",
    async (uri: URL) => {
      const id = uri.pathname.split('/').pop();
      return {
        contents: [{
          uri: uri.toString(),
          text: `This is an example resource with ID: ${id}`
        }]
      };
    }
  );
} 