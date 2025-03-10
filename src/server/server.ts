import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResources } from "../core/resources.js";
import { registerTools } from "../core/tools.js";
import { registerPrompts } from "../core/prompts.js";

// Create and start the MCP server
async function startServer() {
  try {
    // Create a new MCP server instance
    const server = new McpServer({
      name: "MCP Server",
      version: "1.0.0"
    });

    // Register all resources, tools, and prompts
    registerResources(server);
    registerTools(server);
    registerPrompts(server);
    
    // Log server information
    console.error(`MCP Server initialized`);
    console.error("Server is ready to handle requests");
    
    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

// Export the server creation function
export default startServer; 