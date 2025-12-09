# Go-Out MCP Server

A Model Context Protocol (MCP) server for interacting with the [Go-Out](https://go-out.co) ticketing platform.

## 🚀 Features

- **get_events** - Fetch active/past events with statistics
- **get_event_participants** - Get participants (flattened list including companions)
- **get_event_statistics** - Get ticket statistics (accepted, pending, rejected)

## 📦 Installation

```bash
cd go-out-mcp
npm install
```

## ⚙️ Configuration

### For Cursor IDE

Add to your MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "go-out": {
      "command": "node",
      "args": ["/path/to/go-out-mcp/main.mjs"],
      "env": {
        "GOOUT_TOKEN": "your_jwt_token_here"
      }
    }
  }
}
```

### For Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "go-out": {
      "command": "node",
      "args": ["/path/to/go-out-mcp/main.mjs"],
      "env": {
        "GOOUT_TOKEN": "your_jwt_token_here"
      }
    }
  }
}
```

## 🔑 Getting Your Token

1. Log in to Go-Out in your browser
2. Open Developer Tools (F12) → Network tab
3. Find any request to `go-out.co/endOne/...`
4. Copy the JWT from the `Authorization` header (without "Bearer " prefix)

## 🧪 Testing Locally

```bash
# Using MCP Inspector
GOOUT_TOKEN=your_token npx @modelcontextprotocol/inspector node go-out-mcp/main.mjs
```

## 📁 Project Structure

```
go-out-mcp/
├── main.mjs              # Entry point
├── config/
│   └── config.mjs        # Configuration
├── api/
│   ├── client.mjs        # HTTP client
│   ├── events.mjs        # Events API
│   ├── participants.mjs  # Participants API
│   └── statistics.mjs    # Statistics API
└── tools/
    ├── index.mjs         # Tool registry
    ├── events.mjs        # get_events tool
    ├── participants.mjs  # get_event_participants tool
    └── statistics.mjs    # get_event_statistics tool
```

## 📖 Documentation

See [docs/go-out-mcp-usage.md](docs/go-out-mcp-usage.md) for detailed usage guide.

## 📄 License

MIT



