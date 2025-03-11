# @mcpdotdirect/create-mcp-server

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)
![MCP](https://img.shields.io/badge/MCP-1.7+-green)

A CLI tool to create a new Model Context Protocol (MCP) server project. This package provides a template for building custom MCP servers that can be used by AI agents to interact with external systems and data sources.

## 📋 Usage

You can create a new MCP server project using npx:

```bash
# Create a new MCP server in the current directory
npx @mcpdotdirect/create-mcp-server

# Or with npm
npm init @mcpdotdirect/create-mcp-server
```

This will create a new MCP server project in the current directory with all the necessary files. You'll need to install the dependencies manually after creation.

## 🔭 What's Included

The template includes:

- Basic server setup with both stdio and HTTP transport options
- Structure for defining MCP tools, resources, and prompts
- TypeScript configuration
- Development scripts and configuration

## ✨ Features

- **Dual Transport Support**: Run your MCP server over stdio or HTTP
- **TypeScript**: Full TypeScript support for type safety
- **MCP SDK**: Built on the official Model Context Protocol SDK
- **Extensible**: Easy to add custom tools, resources, and prompts

## 🚀 Getting Started

After creating your project:

1. Install dependencies using your preferred package manager:
   ```bash
   # Using npm
   npm install
   
   # Using yarn
   yarn
   
   # Using pnpm
   pnpm install
   
   # Using bun
   bun install
   ```

2. Start the server:
   ```bash
   # Start the stdio server
   npm start
   
   # Or start the HTTP server
   npm run start:http
   ```

3. For development with auto-reload:
   ```bash
   # Development mode with stdio
   npm run dev
   
   # Development mode with HTTP
   npm run dev:http
   ```

> **Note**: The default scripts in package.json use Bun as the runtime (e.g., `bun run src/index.ts`). If you prefer to use a different package manager or runtime, you can modify these scripts in your package.json file to use Node.js or another runtime of your choice.

## 🛠️ Adding Custom Tools and Resources

When adding custom tools, resources, or prompts to your MCP server:

1. Use underscores (`_`) instead of hyphens (`-`) in all resource, tool, and prompt names
   ```typescript
   // Good: Uses underscores
   server.tool(
     "my_custom_tool",
     "Description of my custom tool",
     {
       param_name: z.string().describe("Parameter description")
     },
     async (params) => {
       // Tool implementation
     }
   );
   
   // Bad: Uses hyphens, may cause issues with Cursor
   server.tool(
     "my-custom-tool",
     "Description of my custom tool",
     {
       param-name: z.string().describe("Parameter description")
     },
     async (params) => {
       // Tool implementation
     }
   );
   ```

2. This naming convention ensures compatibility with Cursor and other AI tools that interact with your MCP server

## 📚 Documentation

For more information about the Model Context Protocol, visit the [MCP Documentation](https://modelcontextprotocol.io/introduction).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
