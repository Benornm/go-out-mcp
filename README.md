# Go-Out MCP Server

A Model Context Protocol (MCP) server for interacting with the [Go-Out](https://go-out.co) ticketing platform.

## 🚀 Features

- **get_events** - Fetch active/past events with statistics and free-form language search
- **get_event_participants** - Get participants (flattened list including companions and hidden participants)
- **get_event_statistics** - Get comprehensive ticket statistics (accepted, pending, rejected, hidden, failed)
- **get_salesman_statistics** - Get detailed statistics for salesmen/managers and tracking links (views, registrations, revenue)
- **get_participants_by_salesman** - Get participants filtered by a specific salesman/referrer (flattened list)
- **get_table_report** - Get report of participants wanting reserved seating (tables), grouped by salesman

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
│   ├── statistics.mjs    # Statistics API
│   └── salesman.mjs      # Salesmen & tracking links API
└── tools/
    ├── index.mjs         # Tool registry
    ├── events.mjs        # get_events tool
    ├── participants.mjs  # get_event_participants tool
    ├── statistics.mjs   # get_event_statistics tool
    ├── salesman.mjs      # get_salesman_statistics tool
    ├── participants-by-salesman.mjs # get_participants_by_salesman tool
    └── table-report.mjs  # get_table_report tool
```

## 📖 Documentation

See [docs/go-out-mcp-usage.md](docs/go-out-mcp-usage.md) for detailed usage guide.

## 📄 License

MIT







