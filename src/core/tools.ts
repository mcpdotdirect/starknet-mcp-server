import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as services from "./services/index.js";

/**
 * Register all tools with the MCP server
 * 
 * @param server The MCP server instance
 */
export function registerTools(server: McpServer) {
  // Greeting tool
  server.tool(
    "hello_world",
    "A simple hello world tool",
    {
      name: z.string().describe("Name to greet")
    },
    async (params: { name: string }) => {
      const greeting = services.GreetingService.generateGreeting(params.name);
      return {
        content: [
          {
            type: "text",
            text: greeting
          }
        ]
      };
    }
  );

  // Farewell tool
  server.tool(
    "goodbye",
    "A simple goodbye tool",
    {
      name: z.string().describe("Name to bid farewell to")
    },
    async (params: { name: string }) => {
      const farewell = services.GreetingService.generateFarewell(params.name);
      return {
        content: [
          {
            type: "text",
            text: farewell
          }
        ]
      };
    }
  );
}