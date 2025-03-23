import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import startServerImpl from "./server/server.js";

export const startServer = async () => {
  try {
    const server = await startServerImpl();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Starknet MCP Server running on stdio");
    return server;
  } catch (error) {
    console.error("Error starting Starknet MCP server:", error);
    process.exit(1);
  }
};

// Start the server when this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}