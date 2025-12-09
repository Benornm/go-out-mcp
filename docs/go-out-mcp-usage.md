# Go-Out MCP Server - Usage Guide

> A Model Context Protocol (MCP) server for interacting with the Go-Out ticketing API.

---

## 1. Overview

The Go-Out MCP server provides AI assistants (like Claude) with direct access to the Go-Out ticketing platform. This enables natural language queries about events, participants, and ticket statistics.

### Available Tools

| Tool | Description |
|------|-------------|
| `get_events` | Fetch a list of events with statistics |
| `get_event_participants` | Get participants for a specific event |
| `get_event_statistics` | Get ticket statistics (accepted, pending, rejected) |

---

## 2. Installation

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Comes with Node.js
- **Go-Out Account**: You need an active Go-Out account with API access

### Step 1: Navigate to the MCP folder

```bash
cd go-out-mcp
```

### Step 2: Install dependencies

```bash
npm install
```

### File Structure

```
go_out_mcp/
├── docs/
│   ├── GO_OUT_API_DOCUMENTATION.md   # Full API documentation
│   ├── GO_OUT_API_QUICK_REFERENCE.md # Quick reference guide
│   └── go-out-mcp-usage.md           # This file
└── go-out-mcp/
    ├── package.json                   # Dependencies
    ├── main.mjs                       # MCP server entry point (minimal)
    ├── config/
    │   └── config.mjs                 # Configuration & environment
    ├── api/
    │   ├── index.mjs                  # API exports
    │   ├── client.mjs                 # HTTP client with auth
    │   ├── events.mjs                 # Events API
    │   ├── participants.mjs           # Participants API
    │   └── statistics.mjs             # Statistics API
    └── tools/
        ├── index.mjs                  # Tool registry
        ├── events.mjs                 # get_events tool
        ├── participants.mjs           # get_event_participants tool
        └── statistics.mjs             # get_event_statistics tool
```

---

## 3. Configuration

### Environment Variables

The MCP server requires the following environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOUT_TOKEN` | ✅ Yes | Your Go-Out JWT Bearer token |
| `GOOUT_BASE_URL` | ❌ No | API base URL (default: `https://www.go-out.co/endOne`) |

### Getting Your Go-Out Token

1. Log in to Go-Out in your browser
2. Open browser Developer Tools (F12)
3. Go to Network tab
4. Make any action on the Go-Out dashboard
5. Find a request to `go-out.co/endOne/...`
6. Copy the `Authorization` header value (without "Bearer " prefix)

### Example: Setting Environment Variables

**Option A: Inline (for testing)**
```bash
GOOUT_TOKEN=your_jwt_token_here node go-out-mcp/main.mjs
```

**Option B: In your shell profile (~/.zshrc or ~/.bashrc)**
```bash
export GOOUT_TOKEN="your_jwt_token_here"
```

---

## 4. MCP Client Configuration

### For Cursor IDE

Add this to your Cursor settings (`.cursor/mcp.json` or via Settings > MCP Servers):

```json
{
  "mcpServers": {
    "go-out": {
      "command": "node",
      "args": ["/full/path/to/go_out_mcp/go-out-mcp/main.mjs"],
      "env": {
        "GOOUT_TOKEN": "your_jwt_token_here"
      }
    }
  }
}
```

> **Note**: Replace `/full/path/to/` with the actual absolute path to your project.

### For Claude Desktop

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "go-out": {
      "command": "node",
      "args": ["/full/path/to/go_out_mcp/go-out-mcp/main.mjs"],
      "env": {
        "GOOUT_TOKEN": "your_jwt_token_here"
      }
    }
  }
}
```

---

## 5. How to Run

### Automatic Invocation (Recommended)

When configured in Cursor or Claude Desktop, the MCP server starts automatically when needed. You don't need to run it manually.

### Manual Run (For Testing)

```bash
cd /path/to/go_out_mcp
GOOUT_TOKEN=your_token node go-out-mcp/main.mjs
```

The server will output `Go-Out MCP server started successfully` to stderr when ready.

---

## 6. Usage Examples

### Example 1: Get Active Events

**Prompt:**
> "Use the go-out MCP to get all active events"

**What happens:**
- Calls `get_events` tool with `isActive: true`
- Returns list of upcoming events with their statistics

**Sample response:**
```json
{
  "success": true,
  "count": 5,
  "events": [
    {
      "id": "abc123",
      "title": "Summer Party 2025",
      "url": "summer-party-2025",
      "startDate": "2025-07-15T20:00:00.000Z",
      "statistics": {
        "accepted": 150,
        "pending": 45,
        "rejected": 12,
        "hidden": 3
      }
    }
  ]
}
```

---

### Example 2: Get Participants for an Event

**Prompt:**
> "Use the go-out MCP to call `get_event_participants` with eventId = abc123"

**Or more naturally:**
> "Show me all pending participants for event abc123 using the go-out MCP"

**What happens:**
- Calls `get_event_participants` tool with `eventId: "abc123"` and `status: "Pending"`
- Returns list of participants matching the criteria

**Sample response:**
```json
{
  "success": true,
  "eventId": "abc123",
  "count": 45,
  "participants": [
    {
      "id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "0521234567",
      "email": "john@example.com",
      "status": "Pending",
      "ticketName": "Regular Entry",
      "orderDate": "2025-01-10T14:30:00.000Z"
    }
  ]
}
```

---

### Example 3: Get Event Statistics

**Prompt:**
> "Use the go-out MCP to call `get_event_statistics` with eventId = abc123"

**Or more naturally:**
> "What are the ticket stats for event abc123?"

**What happens:**
- Calls `get_event_statistics` tool with `eventId: "abc123"`
- Returns ticket counts by status

**Sample response:**
```json
{
  "success": true,
  "eventId": "abc123",
  "statistics": {
    "accepted": 150,
    "pending": 45,
    "rejected": 12,
    "total": 207
  }
}
```

---

### Example 4: Search for Specific Events

**Prompt:**
> "Search for events with 'cappella' in the name using go-out MCP"

**What happens:**
- Calls `get_events` tool with `search: "cappella"`
- Returns only events matching the search term

---

### Example 5: Paginated Participant Fetch

**Prompt:**
> "Get the next 50 participants for event abc123, skipping the first 100"

**What happens:**
- Calls `get_event_participants` with `eventId: "abc123"`, `limit: 50`, `skip: 100`
- Returns the requested page of participants

---

## 7. Tool Reference

### `get_events`

Fetch a list of events from Go-Out.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `isActive` | boolean | No | `true` | `true` for active/upcoming, `false` for past |
| `search` | string | No | `""` | Filter events by title |
| `limit` | number | No | `20` | Maximum events to return |

---

### `get_event_participants`

Fetch participants for a specific event.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eventId` | string | **Yes** | - | Event ID |
| `status` | string | No | `"All"` | Filter: `All`, `Pending`, `Accepted`, `Rejected`, `Hidden` |
| `limit` | number | No | `50` | Max participants per page |
| `skip` | number | No | `0` | Pagination offset |

---

### `get_event_statistics`

Get ticket statistics for an event.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eventId` | string | **Yes** | - | Event ID |

---

## 8. Extensibility Notes

### Adding New Tools

The MCP server uses a modular architecture. To add a new tool:

#### Step 1: Add API function (if needed)

Create or edit a file in `api/`:

```javascript
// api/myfeature.mjs
import { apiRequest } from './client.mjs';

export async function fetchMyData(params) {
  return apiRequest('/my-endpoint', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}
```

Then export it from `api/index.mjs`:

```javascript
export { fetchMyData } from './myfeature.mjs';
```

#### Step 2: Create the tool file

Create `tools/myfeature.mjs`:

```javascript
import { fetchMyData } from '../api/index.mjs';

// Tool definition (shown in MCP)
export const definition = {
  name: 'my_tool_name',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Description' }
    },
    required: ['param1']
  }
};

// Tool handler (executes when called)
export async function handler(args) {
  const data = await fetchMyData(args);
  return { success: true, data };
}
```

#### Step 3: Register the tool

Add it to `tools/index.mjs`:

```javascript
import * as myfeature from './myfeature.mjs';

const toolModules = [events, participants, statistics, myfeature];
```

That's it! The tool is now available.

### Potential Future Tools

Based on the API documentation, these tools could be added later:

- `register_participant` - Register a new participant to an event
- `get_ticket_types` - Get available ticket types for an event
- `download_participants_csv` - Export participant data
- `get_table_report` - Get users requesting reserved seating
- `get_birthday_report` - Get birthday list for date range

---

## 9. Troubleshooting

### Common Issues

#### "GOOUT_TOKEN environment variable is not set"

**Cause**: The server can't find your API token.

**Solution**: Make sure you've set the `GOOUT_TOKEN` environment variable either:
- In your MCP client config (`env` section)
- In your shell environment
- Inline when running manually

---

#### "Go-Out API error (401): Unauthorized"

**Cause**: Your token is invalid or expired.

**Solution**:
1. Get a fresh token from Go-Out (see section 3)
2. Update your configuration with the new token
3. Restart the MCP server (restart Cursor/Claude Desktop)

---

#### "Go-Out API error (429): Rate Limited"

**Cause**: Too many requests in a short time.

**Solution**: Wait a few minutes and try again. The Go-Out API has rate limits (approximately 50 requests before needing a pause).

---

#### No response / timeout

**Cause**: Network issues or API down.

**Solution**:
1. Check your internet connection
2. Verify Go-Out website is accessible
3. Check if the base URL is correct

---

### Debug Logging

To see detailed logs, you can modify `apiClient.mjs` to add logging:

```javascript
async function apiRequest(endpoint, options = {}) {
  console.error(`[Go-Out API] ${options.method || 'GET'} ${endpoint}`);
  // ... rest of function
}
```

Logs go to stderr and won't interfere with the MCP protocol.

---

## 10. Security Notes

⚠️ **Important**: 
- Never commit your `GOOUT_TOKEN` to version control
- The token has an expiration date - refresh it periodically
- Use environment variables, not hardcoded values
- The `.env` file should be in `.gitignore`

---

*Last updated: December 9, 2025*

