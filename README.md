# Starknet MCP Server

[![smithery badge](https://smithery.ai/badge/@mcpdotdirect/starknet-mcp-server)](https://smithery.ai/server/@mcpdotdirect/starknet-mcp-server)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)
![MCP](https://img.shields.io/badge/MCP-1.7+-green)
![Starknet.js](https://img.shields.io/badge/Starknet.js-Latest-purple)

A comprehensive Model Context Protocol (MCP) server for the Starknet blockchain. This server provides AI agents with the ability to interact with Starknet networks, query blockchain data, manage wallets, and interact with smart contracts.

<a href="https://glama.ai/mcp/servers/@mcpdotdirect/starknet-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@mcpdotdirect/starknet-mcp-server/badge" alt="Starknet Server MCP server" />
</a>

## 📋 Contents

- [Overview](#-overview)
- [Features](#-features)
- [Supported Networks](#-networks-supported)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Server Configuration](#-server-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
  - [Tools](#available-mcp-tools)
  - [Resources](#available-mcp-resources)
  - [Prompts](#available-mcp-prompts)
- [Usage with AI Assistants](#-usage-with-ai-assistants)
- [Security Considerations](#-security-considerations)
- [Project Structure](#-project-structure)
- [Development Conventions](#️-development-conventions)
- [Documentation](#-documentation)
- [License](#-license)

## 🔭 Overview

The Starknet MCP Server leverages the Model Context Protocol to provide blockchain services to AI agents. It offers a comprehensive interface to the Starknet ecosystem, powering AI assistants with the ability to interact with Starknet blockchain data and operations through natural language.

Key capabilities include:
- Reading blockchain state (balances, transactions, blocks)
- Interacting with Cairo smart contracts
- Transferring tokens (ETH, STRK, and other ERC20 tokens)
- Working with NFTs and token metadata
- Resolving StarknetID domains (similar to ENS for Ethereum)
- Making both read and write operations with proper transaction handling

All services are exposed through a consistent interface of MCP tools and resources, making it easy for AI agents to discover and use Starknet blockchain functionality. **Every tool that accepts Starknet addresses also supports StarknetID**, automatically resolving human-readable identities to addresses behind the scenes.

## ✨ Features

- **Starknet Integration**: Full Starknet blockchain integration using Starknet.js
- **Network Support**: Supports both Mainnet and Sepolia testnet
- **StarknetID Integration**: Resolution of Starknet IDs to addresses and vice versa
- **Native Token Support**: Support for both ETH and STRK native tokens
- **Smart Contract Interaction**: Call and query Starknet smart contracts
- **Dual Transport**: Run as stdio server or HTTP server for different integration needs
- **AI-Ready**: Designed to be used with Claude, GPT, and other AI assistants

### Blockchain Information
- Query chain information (chain ID, latest block)
- Explore block details and transactions
- View transaction receipts and status
- Get address information and contract data

### Native Token Operations
- Get ETH and STRK balances for any address
- Transfer ETH and STRK between accounts
- View combined native token balances

### Token Operations
- Get ERC20 token balances and information
- Transfer ERC20 tokens
- View token supply and metadata
- Check token ownership

### NFT Operations
- Check NFT ownership by token ID
- Get NFT collection information
- View NFT balances for addresses

### Smart Contract Interaction
- Call read-only contract functions
- Execute contract writes with transaction confirmation
- Get contract storage information
- View ABIs and contract class information

### StarknetID
- Resolve Starknet addresses to Starknet IDs
- Resolve Starknet IDs to addresses
- Get complete Starknet ID profiles with verification data
- Validate Starknet domains

## 🔧 Networks Supported

The server supports the following Starknet networks:

- **Mainnet**: The primary Starknet production network
- **Sepolia**: Starknet's testnet on Ethereum's Sepolia

## 🛠️ Prerequisites

- [Bun](https://bun.sh/) 1.0.0 or higher (recommended)
- Node.js 18.0.0 or higher

## 📦 Installation

### Installing via Smithery

To install starknet-mcp-server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@mcpdotdirect/starknet-mcp-server):

```bash
npx -y @smithery/cli install @mcpdotdirect/starknet-mcp-server --client claude
```

### Option 1: Use without installation (npx)

The easiest way to get started is to use `npx` to run the package directly:

```bash
# Run the stdio server without installation
npx @mcpdotdirect/starknet-mcp-server

# Run the HTTP server without installation
npx @mcpdotdirect/starknet-mcp-server http
```

This will automatically download and run the latest version without needing to install it first.

### Option 2: Global installation

If you plan to use it frequently, you can install it globally:

```bash
# Install globally
npm install -g @mcpdotdirect/starknet-mcp-server

# Then run from anywhere
starknet-mcp-server
starknet-mcp-server http
```

### Option 3: Local project installation

```bash
# Add to your project
npm install @mcpdotdirect/starknet-mcp-server

# Using yarn
yarn add @mcpdotdirect/starknet-mcp-server

# Using pnpm
pnpm add @mcpdotdirect/starknet-mcp-server
```

Then add to your package.json scripts:
```json
"scripts": {
  "starknet-mcp": "starknet-mcp-server",
  "starknet-mcp-http": "starknet-mcp-server http"
}
```

### Option 4: Running from source

If you want to run from source or develop locally:

```bash
# Clone the repository
git clone https://github.com/mcpdotdirect/starknet-mcp-server.git
cd starknet-mcp-server

# Install dependencies
npm install

# Start the stdio server
npm start

# Or start the HTTP server
npm run start:http
```

For development with auto-reload:
```bash
# Development mode with stdio
npm run dev

# Development mode with HTTP
npm run dev:http
```

## ⚙️ Server Configuration

The server uses the following default configuration:

- **Default Network**: Mainnet
- **Server Port**: 3000 (HTTP mode)
- **Server Host**: 0.0.0.0 (accessible from any network interface)

These values are hardcoded in the application. If you need to modify them, you can edit the following files:

- For network configuration: `src/core/chains.ts`
- For server configuration: `src/server/http-server.ts`

## 🔍 Usage

### Running the Server

You can run the Starknet MCP Server in two modes:

```bash
# Run the server in stdio mode (for CLI tools and AI assistants)
npx @mcpdotdirect/starknet-mcp-server

# Run the server in HTTP mode (for web applications)
npx @mcpdotdirect/starknet-mcp-server http
```

The HTTP server runs on port 3000 by default and provides both a REST API and Server-Sent Events (SSE) for real-time communication.

### Connecting from Cursor

To connect to the Starknet MCP server from Cursor:

1. Open Cursor and go to Settings (gear icon in the bottom left)
2. Click on "Features" in the left sidebar
3. Scroll down to "MCP Servers" section
4. Click "Add new MCP server"
5. Enter the following details:
   - Server name: `starknet-mcp-server`
   - Type: `command`
   - Command: `npx @mcpdotdirect/starknet-mcp-server`

6. Click "Save"

Once connected, you can use the MCP server's capabilities directly within Cursor. The server will appear in the MCP Servers list and can be enabled/disabled as needed.

### Using mcp.json with Cursor

For a more portable configuration that you can share with your team or use across projects, you can create an `.cursor/mcp.json` file in your project's root directory:

```json
{
  "mcpServers": {
    "starknet-mcp-server": {
      "command": "npx",
      "args": [
        "@mcpdotdirect/starknet-mcp-server"
      ]
    },
    "starknet-mcp-http": {
      "command": "npx",
      "args": [
        "@mcpdotdirect/starknet-mcp-server",
        "http"
      ]
    }
  }
}
```

Place this file in your project's `.cursor` directory (create it if it doesn't exist), and Cursor will automatically detect and use these MCP server configurations when working in that project.

### HTTP Mode with SSE

If you're developing a web application and want to connect to the HTTP server with Server-Sent Events (SSE), you can use this configuration:

```json
{
  "mcpServers": {
    "starknet-mcp-sse": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

### Connecting using Claude CLI

If you're using Claude CLI, you can connect to the MCP server with just two commands:

```bash
# Add the MCP server using npx
claude mcp add starknet-mcp-server npx @mcpdotdirect/starknet-mcp-server

# Start Claude with the MCP server enabled
claude
```

### Example: Using the MCP Server in Cursor

After configuring the MCP server, you can easily use it in Cursor. For example:

1. Create a new JavaScript/TypeScript file in your project:

```javascript
// starknet-example.js
async function main() {
  try {
    // When using with Cursor, you can simply ask Cursor to:
    // "Check the ETH balance of address 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7 on Starknet mainnet"
    // Or "Lookup the Starknet ID for address 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
    
    // Cursor will use the MCP server to execute these operations 
    // without requiring any additional code from you
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
```

2. With the file open in Cursor, you can ask Cursor to:
   - "Check the ETH balance of vitalik.stark"
   - "Get information about the latest block on Starknet"
   - "Look up the owner of NFT #123 in collection 0x..."

### Example: Getting an ETH Balance with Starknet ID

```javascript
// Example of using the MCP client to check an ETH balance using Starknet ID
const mcp = new McpClient("http://localhost:3000");

const result = await mcp.invokeTool("get_starknet_eth_balance", {
  address: "vitalik.stark", // Starknet ID instead of address
  network: "mainnet"
});

console.log(result);
// {
//   wei: "1000000000000000000",
//   ether: "1.0"
// }
```

### Example: Resolving a Starknet ID

```javascript
// Example of using the MCP client to resolve a Starknet ID to an address
const mcp = new McpClient("http://localhost:3000");

const result = await mcp.invokeTool("resolve_starknet_address", {
  name: "vitalik.stark",
  network: "mainnet"
});

console.log(result);
// {
//   starknetId: "vitalik.stark",
//   address: "0x04d07e40e93398ed3c76981e449d3446f7c4e52aac5b3e8a37d7b0ca30845a5d",
//   resolved: true
// }
```

### Example: Calling a Smart Contract

```javascript
// Example of using the MCP client to call a smart contract function
const mcp = new McpClient("http://localhost:3000");

const result = await mcp.invokeTool("call_starknet_contract", {
  contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // ETH contract
  entrypoint: "totalSupply",
  calldata: [],
  network: "mainnet"
});

console.log(result);
// {
//   result: ["0x84b6c7d5970d5a73abe"]
// }
```

### Using in a Node.js Project

If you want to programmatically use the MCP server in your Node.js project:

```javascript
// Start the MCP server as a child process
const { spawn } = require('child_process');
const mcpServer = spawn('npx', ['@mcpdotdirect/starknet-mcp-server']);

// Connect to it with the MCP client
const mcp = new McpClient({ process: mcpServer });

// Now you can use the client
const networks = await mcp.invokeTool("get_supported_starknet_networks", {
  random_string: "any"
});
console.log("Supported networks:", networks);
```

For more advanced usage, you can create a wrapper class around the HTTP API or use libraries like Axios for cleaner API calls.

## 📚 API Reference

### Available MCP Tools

This server implements the following MCP tools:

#### Network Tools
- `get_starknet_chain_info`: Get information about a Starknet network
- `get_supported_starknet_networks`: Get a list of supported Starknet networks

#### Balance Tools
- `get_starknet_eth_balance`: Get the ETH balance for a Starknet address or Starknet ID
- `get_starknet_token_balance`: Get the balance of any token for an address
- `get_starknet_strk_balance`: Get the STRK token balance for an address
- `get_starknet_native_balances`: Get all native token balances (ETH and STRK) for an address

#### StarknetID Tools
- `resolve_starknet_name`: Get the Starknet ID for an address
- `resolve_starknet_address`: Get the address for a Starknet ID
- `get_starknet_profile`: Get the full Starknet ID profile for an address
- `validate_starknet_domain`: Check if a string is a valid Starknet ID

#### Block Tools
- `get_starknet_block`: Get information about a specific block
- `get_starknet_block_transactions`: Get transactions in a specific block

#### Transaction Tools
- `get_starknet_transaction`: Get details about a transaction
- `get_starknet_transaction_receipt`: Get transaction receipt
- `check_starknet_transaction_status`: Check if a transaction is confirmed

#### Contract Tools
- `call_starknet_contract`: Call a read-only function on a contract
- `get_starknet_contract_class`: Get the class (ABI and other information) of a contract
- `execute_starknet_contract`: Execute a contract call (write operation)

#### Token Tools
- `get_starknet_token_info`: Get information about a token
- `get_starknet_token_supply`: Get the total supply of a token
- `check_starknet_nft_ownership`: Check if an address owns a specific NFT
- `get_starknet_nft_balance`: Get the number of NFTs owned by an address

#### Transfer Tools
- `transfer_starknet_eth`: Transfer ETH from one account to another (amounts in human-readable format)
- `transfer_starknet_strk`: Transfer STRK from one account to another (amounts in human-readable format)
- `transfer_starknet_token`: Transfer ERC20 tokens from one account to another (amounts in human-readable format)

### Available MCP Resources

The server provides the following MCP resources:

#### Network Resources
- `starknet://{network}/chain`: Get chain information for a specific network
- `starknet://networks`: Get a list of all supported networks

#### Block Resources
- `starknet://{network}/block/{blockIdentifier}`: Get information about a specific block
- `starknet://{network}/block/latest`: Get the latest block

#### Address Resources
- `starknet://{network}/address/{address}`: Get information about an address

#### Transaction Resources
- `starknet://{network}/tx/{txHash}`: Get transaction information

#### StarknetID Resources
- `starknet://{network}/id/address/{address}`: Resolve an address to a Starknet ID
- `starknet://{network}/id/name/{name}`: Resolve a Starknet ID to an address
- `starknet://{network}/id/profile/{address}`: Get the Starknet ID profile for an address

### Available MCP Prompts

For LLM interactions, the server provides these prompts:

- `explore_starknet_block`: Explore information about a specific Starknet block
- `explore_starknet_address`: Get information about a Starknet address
- `explore_starknet_transaction`: Get information about a Starknet transaction
- `lookup_starknet_id`: Look up a Starknet ID or resolve an address to a Starknet ID
- `explore_starknet_id_profile`: Explore a full Starknet ID profile

## 🔍 Usage with AI Assistants

When using this server with AI assistants like Claude or GPT:

1. Configure your AI assistant to use this MCP server
2. The assistant can then use tools to interact with Starknet
3. Example queries:
   - "What's the ETH balance of address 0x04d07e40e93398ed3c76981e449d3446f7c4e52aac5b3e8a37d7b0ca30845a5d?"
   - "Look up the Starknet ID for address 0x04d07e40e93398ed3c76981e449d3446f7c4e52aac5b3e8a37d7b0ca30845a5d"
   - "What's in the latest block on Starknet mainnet?"
   - "Get information about transaction 0x7e3a33ab42f2e24184763563b7b8482b53e3b89831ebc3eacf29d4d11f5198"
   - "Resolve the Starknet ID vitalik.stark to an address"

## 🔒 Security Considerations

- **Private keys** are used only for transaction signing and are never stored by the server
- **All token amounts** are specified in human-readable format (e.g., ETH, STRK, token units) rather than in wei or smallest units
- Always validate and sanitize input parameters before executing operations
- Consider implementing additional authentication mechanisms for production use
- Use HTTPS for the HTTP server in production environments
- Implement rate limiting to prevent abuse
- For high-value services, consider adding confirmation steps

## 📁 Project Structure

```
starknet-mcp-server/
├── src/
│   ├── index.ts                # Main stdio server entry point
│   ├── server/                 # Server-related files
│   │   ├── http-server.ts      # HTTP server with SSE
│   │   └── server.ts           # General server setup
│   ├── core/
│   │   ├── chains.ts           # Chain definitions and utilities
│   │   ├── resources.ts        # MCP resources implementation
│   │   ├── tools.ts            # MCP tools implementation
│   │   ├── prompts.ts          # MCP prompts implementation
│   │   └── services/           # Core blockchain services
│   │       ├── index.ts        # Service exports
│   │       ├── balance.ts      # Balance services
│   │       ├── blocks.ts       # Block services
│   │       ├── clients.ts      # Client utilities
│   │       ├── contracts.ts    # Contract interactions
│   │       ├── starknetid.ts   # Starknet ID services
│   │       ├── tokens.ts       # Token services
│   │       ├── transactions.ts # Transaction services
│   │       ├── transfer.ts     # Transfer services
│   │       └── utils.ts        # Utility functions
├── package.json
├── tsconfig.json
└── README.md
```

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
- [StarknetID Documentation](https://docs.starknet.id/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.