# Starknet MCP Server

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)
![MCP](https://img.shields.io/badge/MCP-1.7+-green)
![Starknet.js](https://img.shields.io/badge/Starknet.js-Latest-purple)

An MCP (Model Context Protocol) server for the Starknet blockchain. This server provides AI agents with the ability to interact with Starknet networks, query blockchain data, manage wallets, and interact with smart contracts.

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

- **Starknet Integration**: Full Starknet blockchain integration using Starknet.js
- **Network Support**: Supports both Mainnet and Sepolia testnet
- **StarknetID Integration**: Resolution of Starknet IDs to addresses and vice versa
- **Native Token Support**: Support for both ETH and STRK native tokens
- **Smart Contract Interaction**: Call and query Starknet smart contracts
- **Dual Transport**: Run as stdio server or HTTP server for different integration needs
- **AI-Ready**: Designed to be used with Claude, GPT, and other AI assistants

## 🚀 Getting Started

1. Install dependencies:
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

## 🔧 Supported Features

### Blockchain Information
- Query chain information (chain ID, latest block)
- Explore block details
- Search transactions
- Get address information

### Native Token Operations
- Get ETH and STRK balances
- Transfer tokens

### Smart Contract Interaction
- Call read-only contract functions
- Get contract storage information
- View ABIs and contract class information

### StarknetID
- Resolve Starknet addresses to Starknet IDs
- Resolve Starknet IDs to addresses
- Get Starknet ID profiles

### NFT Operations
- Check NFT ownership
- Get NFT collection information

## 🔍 Usage with AI Assistants

When using this server with AI assistants like Claude or GPT:

1. Configure your AI assistant to use this MCP server
2. The assistant can then use tools to interact with Starknet
3. Example: "Look up the Starknet ID for address 0x123..."

## 📦 API Structure

The server provides:

- **Tools**: Direct function calls to perform blockchain operations
- **Resources**: Structured data endpoints in the form of starknet://{network}/...
- **Prompts**: Pre-built prompts to help AI agents explore the Starknet blockchain

## 🛠️ Development Conventions

When adding custom tools, resources, or prompts:

1. Use underscores (`_`) instead of hyphens (`-`) in all resource, tool, and prompt names
   ```typescript
   // Good: Uses underscores
   server.tool(
     "starknet_contract_call",
     "Description of the tool",
     {
       contract_address: z.string().describe("The contract address")
     },
     async (params) => {
       // Tool implementation
     }
   );
   ```

2. This naming convention ensures compatibility with Cursor and other AI tools

## 📚 Documentation

For more information about:
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [Starknet.js Documentation](https://www.starknetjs.com/)
- [Starknet Documentation](https://docs.starknet.io/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
