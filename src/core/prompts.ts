import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register all prompts with the MCP server
 * @param server The MCP server instance
 */
export function registerPrompts(server: McpServer) {
  // Example prompt
  server.prompt(
    "greeting",
    "A simple greeting prompt",
    {
      name: z.string().describe("Name to greet")
    },
    (params: { name: string }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Hello, ${params.name}! How can I help you today?`
        }
      }]
    })
  );
}
