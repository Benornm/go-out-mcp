# Go-Out MCP Server - Usage Guide

> A Model Context Protocol (MCP) server for interacting with the Go-Out ticketing API.

---

## 1. Overview

The Go-Out MCP server provides AI assistants (like Claude) with direct access to the Go-Out ticketing platform. This enables natural language queries about events, participants, and ticket statistics.

### Available Tools

| Tool | Description |
|------|-------------|
| `get_events` | Fetch a list of events with statistics. Supports pagination, search by name, and filtering by active status. Can search events using free-form language (e.g., "events on Thursday last month") |
| `get_event_participants` | Get participants for a specific event. Returns a **flattened list** where each participant (primary + companions) is a separate entry. Automatically includes hidden participants when status is "All". |
| `get_event_statistics` | Get comprehensive ticket statistics including accepted, pending, rejected, hidden, and failed counts |
| `get_salesman_statistics` | Get detailed statistics for salesmen/managers and tracking links for an event. Shows views, free registrations, paid registrations, and revenue statistics. Tracking links are included as salesmen |

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
    │   ├── statistics.mjs             # Statistics API
    │   └── salesman.mjs               # Salesmen & tracking links API
    └── tools/
        ├── index.mjs                  # Tool registry
        ├── events.mjs                 # get_events tool
        ├── participants.mjs           # get_event_participants tool
        ├── statistics.mjs             # get_event_statistics tool
        └── salesman.mjs               # get_salesman_statistics tool
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
  "skip": 0,
  "limit": 20,
  "hasMore": true,
  "events": [
    {
      "id": "abc123",
      "title": "Summer Party 2025",
      "url": "summer-party-2025",
      "startDate": "2025-07-15T20:00:00.000Z",
      "endDate": "2025-07-16T02:00:00.000Z",
      "address": "123 Main St, Tel Aviv",
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

### Example 2: Free-Form Language Event Search

The AI can understand natural language queries about events:

**Prompt:**
> "תביא לי את כל האירועים שהיו ימי חמישי בחודש האחרון"
> (Bring me all events that were on Thursdays last month)

**What happens:**
- AI calls `get_events` with `isActive: false` to get past events
- AI analyzes the event dates and filters for Thursdays in the last month
- Returns matching events

**Another example:**
> "תראה לי את האירוע של cappella ביום חמישי הקרוב"
> (Show me the Cappella event on the upcoming Thursday)

**What happens:**
- AI calls `get_events` with `search: "cappella"` and `isActive: true`
- AI filters results to find the event on the next Thursday
- Returns the matching event

---

### Example 3: Paginated Event Fetching

**Prompt:**
> "Get the first 200 inactive events, then the next 200"

**What happens:**
- First call: `get_events({ isActive: false, limit: 200, skip: 0 })`
- Second call: `get_events({ isActive: false, limit: 200, skip: 200 })`
- Returns paginated results for large event databases

---

### Example 4: Get Participants for an Event (Flattened)

**Important:** The `get_event_participants` tool returns a **flattened list** where each participant (primary + companions) is a separate entry.

**Prompt:**
> "Show me all participants for event abc123"

**What happens:**
- Calls `get_event_participants` with `eventId: "abc123"` and `status: "All"`
- Automatically fetches both regular and hidden participants
- Flattens the response so each person is a separate entry

**Sample response:**
```json
{
  "success": true,
  "eventId": "abc123",
  "orderCount": 92,
  "count": 120,
  "status": "All (including hidden)",
  "participants": [
    {
      "id": "order123",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "0521234567",
      "email": "john@example.com",
      "birthdate": "1995-12-10",
      "gender": "זכר",
      "age": 30,
      "status": "Accepted",
      "hidden": false,
      "orderDate": "2025-12-09T10:00:00.000Z",
      "ticketName": "Entry Ticket until 22:30",
      "ticketPrice": "0.00",
      "orderId": "order123",
      "isCompanion": false
    },
    {
      "id": "companion456",
      "firstName": "Jane",
      "lastName": "Doe",
      "phoneNumber": "0521234567",
      "email": "john@example.com",
      "birthdate": "1995-12-10",
      "gender": "נקבה",
      "age": 30,
      "status": "Accepted",
      "hidden": false,
      "orderDate": "2025-12-09T10:00:00.000Z",
      "ticketName": "Entry Ticket until 22:30",
      "ticketPrice": "0.00",
      "orderId": "order123",
      "isCompanion": true,
      "primaryParticipantName": "John Doe"
    }
  ]
}
```

**Key points:**
- `orderCount: 92` = number of orders
- `count: 120` = number of individual participants (after flattening)
- Companions inherit fields from the primary order (phone, email, birthdate, etc.)
- `isCompanion: true` indicates this is a companion, not the primary participant
- `orderId` links companions back to their primary participant

---

### Example 5: Filter Participants by Status

**Prompt:**
> "Show me all pending participants for event abc123"

**What happens:**
- Calls `get_event_participants` with `eventId: "abc123"` and `status: "Pending"`
- Returns only participants with pending status

**Prompt:**
> "Get all hidden participants for event abc123"

**What happens:**
- Calls `get_event_participants` with `eventId: "abc123"` and `status: "Hidden"`
- Returns only hidden participants

---

### Example 6: Get Participants with Birthday Filtering

**Prompt:**
> "תביא לי את כל האנשים שנרשמו ל2 האירועים הקרובים בקפלה (11.12 + 12.12) ויש להם יומהולדת בין התאריכים 7.12-15.12"
> (Get all people registered for the 2 upcoming Cappella events (11.12 + 12.12) who have birthdays between 7.12-15.12)

**What happens:**
1. AI calls `get_events` to find the two Cappella events on 11.12 and 12.12
2. AI calls `get_event_participants` for each event with `status: "All"`
3. AI filters participants by `birthdate` field to find those with birthdays in the specified range
4. Returns matching participants

**Note:** The `birthdate` field is included in the participant response for filtering purposes.

---

### Example 7: Get Comprehensive Event Statistics

**Prompt:**
> "What are the ticket stats for event abc123?"

**What happens:**
- Calls `get_event_statistics` tool with `eventId: "abc123"`
- Returns comprehensive statistics including hidden and failed counts

**Sample response:**
```json
{
  "success": true,
  "eventId": "abc123",
  "statistics": {
    "accepted": 362,
    "pending": 0,
    "rejected": 4,
    "hidden": 305,
    "failed": 0,
    "total": 671
  }
}
```

**Key points:**
- `hidden`: Participants marked as hidden
- `failed`: Failed registrations
- `total`: Sum of all statuses

---

### Example 8: Paginated Participant Fetch

**Prompt:**
> "Get the next 50 participants for event abc123, skipping the first 100"

**What happens:**
- Calls `get_event_participants` with `eventId: "abc123"`, `limit: 50`, `skip: 100`
- Returns the requested page of participants (flattened)

---

### Example 9: Get Salesman Statistics

**Prompt:**
> "תראה לי את הסטטיסטיקות של כל אנשי המכירות לאירוע X"
> (Show me statistics for all salesmen for event X)

**What happens:**
- Calls `get_salesman_statistics` with `eventId: "X"`
- Returns statistics for all salesmen/managers **and tracking links** including views, registrations, and revenue
- Tracking links are treated as salesmen and included in the same response

**Sample response:**
```json
{
  "success": true,
  "eventId": "abc123",
  "salesmen": [
    {
      "type": "salesman",
      "id": "691c5735fa4d6929738e375b",
      "phoneNumber": "0503534351",
      "firstName": "Dor",
      "lastName": "Kamus",
      "email": "dorkamus53@gmail.com",
      "role": {
        "english": "Manager",
        "hebrew": "מנהל"
      },
      "statistics": {
        "totalRegistrations": 51,
        "freeRegistrations": 41,
        "paidRegistrations": 10,
        "revenue": 700,
        "views": 234
      },
      "link": "https://www.go-out.co/event/...?ref=..."
    },
    {
      "type": "tracking_link",
      "id": "aze09909egeef",
      "linkName": "קידום ממומן",
      "link": "aze09909egeef",
      "activeLink": true,
      "referer": {
        "firstName": "Nati",
        "lastName": "Levi",
        "phoneNumber": "0507822986"
      },
      "statistics": {
        "totalRegistrations": 33,
        "freeRegistrations": 27,
        "paidRegistrations": 6,
        "revenue": 420,
        "views": 576
      },
      "sold": 61,
      "hiddenRegistrations": 28
    }
  ],
  "summary": {
    "totalSalesmen": 26,
    "totalViews": 1441,
    "totalFreeRegistrations": 185,
    "totalPaidRegistrations": 27,
    "totalRegistrations": 212,
    "totalRevenue": 1890,
    "topSalesman": {
      "id": "691c5735fa4d6929738e375b",
      "phoneNumber": "0503534351",
      "name": "Dor Kamus",
      "type": "salesman",
      "totalRegistrations": 51
    }
  }
}
```

**Key fields:**
- **For salesmen (`type: "salesman"`):**
  - `views`: Number of views/impressions
  - `freeRegistrations` (`frees`): Number of free registrations
  - `paidRegistrations` (`paid`): Number of paid registrations
  - `revenue`: Revenue from credit card payments (amount from paid registrations via credit cards)
  
- **For tracking links (`type: "tracking_link"`):**
  - `linkName`: Name of the tracking link
  - `link`: The tracking link identifier
  - `activeLink`: Boolean indicating if the link is active
  - `referer`: Object with information about who created the link
  - `views`: Number of views/impressions (`Views` or `views` from API)
  - `freeRegistrations` (`frees`): Number of free registrations
  - `paidRegistrations`: Calculated as `total_revenue / 70` (ticket price)
  - `revenue` (`total_revenue`): Total revenue from the tracking link
  - `sold`: Total sold (includes free + paid + hidden)
  - `hiddenRegistrations`: Calculated as `sold - frees - paidRegistrations`

**Note:** 
- `revenue` represents the actual money amount from paid registrations via credit cards, not the count of registrations.
- Tracking links are automatically included in the response and treated as salesmen for statistics purposes.
- Results are sorted by total registrations (free + paid) in descending order.

---

## 7. Tool Reference

### `get_events`

Fetch a list of events from Go-Out with pagination and search capabilities. Supports free-form language queries for finding events by name and date.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `isActive` | boolean | No | `true` | `true` for active/upcoming events, `false` for past events |
| `search` | string | No | `""` | Search filter for event titles (case-insensitive) |
| `limit` | number | No | `20` | Maximum events to return (max: 200) |
| `skip` | number | No | `0` | Pagination offset - number of events to skip |

**Response fields:**
- `success`: Boolean indicating if the request succeeded
- `count`: Number of events returned in this response
- `skip`: The pagination offset used
- `limit`: The limit used
- `hasMore`: Boolean indicating if more events are available
- `events`: Array of event objects with:
  - `id`: Event ID
  - `title`: Event title
  - `url`: Event URL slug
  - `address`: Event address
  - `startDate`: Event start date (ISO 8601)
  - `endDate`: Event end date (ISO 8601)
  - `statistics`: Object with `accepted`, `pending`, `rejected`, `hidden` counts

**Free-form language support:**
The AI can understand natural language queries like:
- "events on Thursday last month"
- "Cappella events next week"
- "events on December 12th"

The AI will automatically call `get_events` with appropriate filters and then filter results based on dates.

---

### `get_event_participants`

Fetch participants for a specific event. **Returns a flattened list** where each participant (primary + companions) is a separate entry.

**Important:** When `status: "All"` is used, the tool automatically makes two API calls (one for regular participants, one for hidden) and combines the results. This ensures you get truly ALL participants.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eventId` | string | **Yes** | - | Event ID |
| `status` | string | No | `"All"` | Filter: `All`, `Pending`, `Accepted`, `Rejected`, `Hidden` |
| `includeHidden` | boolean | No | `true` | When `status: "All"`, also fetch hidden participants |
| `limit` | number | No | `50` | Max participants per page (applies to each API call) |
| `skip` | number | No | `0` | Pagination offset |

**Response fields:**
- `success`: Boolean indicating if the request succeeded
- `eventId`: The event ID queried
- `orderCount`: Number of orders (before flattening)
- `count`: Number of individual participants (after flattening)
- `skip`: The pagination offset used
- `status`: The status filter used (or "All (including hidden)" if hidden were included)
- `participants`: Array of participant objects with:
  - `id`: Participant ID
  - `firstName`: First name
  - `lastName`: Last name
  - `phoneNumber`: Phone number
  - `email`: Email address
  - `birthdate`: Date of birth (ISO format, e.g., "1995-12-10")
  - `gender`: Gender (Hebrew: "זכר" or "נקבה")
  - `age`: Age
  - `status`: Registration status (`Accepted`, `Pending`, `Rejected`, `Hidden`)
  - `hidden`: Boolean indicating if participant is hidden
  - `orderDate`: Date when order was placed
  - `ticketName`: Name of ticket type
  - `ticketPrice`: Ticket price
  - `referrer`: Object with referrer info (`id`, `firstName`, `lastName`) or `null`
  - `orderId`: ID of the order (links companions to primary participant)
  - `isCompanion`: Boolean - `true` if this is a companion, `false` if primary participant
  - `primaryParticipantName`: Name of primary participant (only present if `isCompanion: true`)

**Flattening behavior:**
- Each order becomes multiple participant entries: one for the primary participant + one for each companion
- Companions inherit fields from the primary order (phone, email, birthdate, status, hidden, etc.)
- The `count` field reflects the total number of individual participants, not orders
- Use `orderId` to group participants from the same order

---

### `get_event_statistics`

Get comprehensive ticket statistics for an event, including hidden and failed counts.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eventId` | string | **Yes** | - | Event ID |

**Response fields:**
- `success`: Boolean indicating if the request succeeded
- `eventId`: The event ID queried
- `statistics`: Object with:
  - `accepted`: Number of accepted registrations
  - `pending`: Number of pending registrations
  - `rejected`: Number of rejected registrations
  - `hidden`: Number of hidden registrations
  - `failed`: Number of failed registrations
  - `total`: Sum of all statuses

---

### `get_salesman_statistics`

Get detailed statistics for salesmen/managers **and tracking links** for a specific event. Shows views, free registrations, paid registrations, and revenue statistics. Tracking links are automatically included and treated as salesmen.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eventId` | string | **Yes** | - | Event ID |
| `search` | string | No | `""` | Search filter for salesman names (applies only to salesmen, not tracking links) |
| `skipNum` | number | No | `0` | Pagination offset (applies only to salesmen, not tracking links) |

**Response fields:**
- `success`: Boolean indicating if the request succeeded
- `eventId`: The event ID queried
- `salesmen`: Array of salesman/tracking link objects (mixed). Each object has a `type` field:
  
  **For salesmen (`type: "salesman"`):**
  - `type`: Always `"salesman"`
  - `id`: Salesman role ID
  - `userId`: User ID
  - `phoneNumber`: Phone number (unique identifier)
  - `firstName`: First name
  - `lastName`: Last name
  - `email`: Email address
  - `role`: Object with `english` and `hebrew` role names (Manager, Owner, Salesman)
  - `statistics`: Object with (ordered by importance):
    - `totalRegistrations`: Total registrations (free + paid)
    - `freeRegistrations`: Number of free registrations (`frees`)
    - `paidRegistrations`: Number of paid registrations (`paid`)
    - `revenue`: Revenue from credit card payments (amount from paid registrations via credit cards)
    - `views`: Number of views/impressions
  - `link`: Referral link for the salesman
  - `joiningDate`: Date when salesman joined
  - `addedBy`: Object with information about who added the salesman
  - `teamleaderRef`: Team leader reference (if applicable)
  - `disabled`: Boolean indicating if salesman is disabled
  - `permissions`: Object with permission flags
  
  **For tracking links (`type: "tracking_link"`):**
  - `type`: Always `"tracking_link"`
  - `id`: Tracking link identifier (same as `link`)
  - `linkName`: Name of the tracking link
  - `link`: The tracking link identifier
  - `activeLink`: Boolean indicating if the link is active
  - `referer`: Object with `firstName`, `lastName`, `phoneNumber` of who created the link
  - `statistics`: Object with (ordered by importance):
    - `totalRegistrations`: Total registrations (free + paid)
    - `freeRegistrations`: Number of free registrations (`frees` from API)
    - `paidRegistrations`: Calculated as `total_revenue / 70` (ticket price)
    - `revenue`: Total revenue (`total_revenue` from API)
    - `views`: Number of views/impressions (`Views` or `views` from API)
  - `sold`: Total sold count (includes free + paid + hidden registrations)
  - `hiddenRegistrations`: Calculated as `sold - frees - paidRegistrations`

- `summary`: Object with aggregated statistics (includes both salesmen and tracking links):
  - `totalSalesmen`: Total number of salesmen + tracking links
  - `totalViews`: Sum of all views
  - `totalFreeRegistrations`: Sum of all free registrations
  - `totalPaidRegistrations`: Sum of all paid registrations
  - `totalRegistrations`: Total registrations (free + paid)
  - `totalRevenue`: Total revenue from all credit card payments
  - `topSalesman`: Object with information about the top performing salesman/tracking link:
    - `id`: ID of the top performer
    - `name`: Name (salesman name or tracking link name)
    - `phoneNumber`: Phone number (if available)
    - `type`: `"salesman"` or `"tracking_link"`
    - `totalRegistrations`: Total registrations count

**Important notes:**
- Tracking links are automatically fetched and included in the response
- Results are sorted by total registrations (free + paid) in descending order
- **Tracking link calculations:**
  - `paidRegistrations` = `total_revenue / 70` (ticket price is 70₪)
  - `totalRegistrations` = `freeRegistrations + paidRegistrations`
  - `hiddenRegistrations` = `sold - freeRegistrations - paidRegistrations`
  - `sold` includes all registrations: free + paid + hidden
- The `search` and `skipNum` parameters apply only to salesmen, not tracking links
- Both salesmen and tracking links are included in the summary statistics

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

To see detailed logs, you can modify `api/client.mjs` to add logging:

```javascript
apiClient.interceptors.request.use(request => {
  console.error(`[Go-Out API] ${request.method} ${request.url}`);
  return request;
});
```

Logs go to stderr and won't interfere with the MCP protocol.

---

### "Birthdate field not appearing in results"

**Cause**: The Go-Out API may not return the `birthdate` field in all responses, or the MCP server needs to be restarted.

**Solution**:
1. Restart Cursor/Claude Desktop to reload the MCP server
2. Check the Network tab in your browser when viewing participants in Go-Out to verify if `birthdate` is returned by the API
3. If the API doesn't return `birthdate`, contact Go-Out support to enable this field

---

## 10. Security Notes

⚠️ **Important**: 
- Never commit your `GOOUT_TOKEN` to version control
- The token has an expiration date - refresh it periodically
- Use environment variables, not hardcoded values
- The `.env` file should be in `.gitignore`

---

---

## 11. Key Features Summary

### ✨ Recent Enhancements

1. **Pagination Support**
   - `get_events` now supports `skip` parameter for pagination
   - `get_event_participants` supports `skip` and `limit` for large participant lists
   - Maximum limit of 200 events per request

2. **Flattened Participants**
   - Each participant (primary + companions) is returned as a separate entry
   - Companions inherit relevant fields from the primary order
   - Clear indicators (`isCompanion`, `orderId`) for relationship tracking
   - `count` reflects total individual participants, not orders

3. **Comprehensive Hidden Participants**
   - When `status: "All"` is used, automatically fetches both regular and hidden participants
   - Two parallel API calls ensure complete data retrieval
   - `includeHidden` parameter controls this behavior

4. **Enhanced Statistics**
   - New endpoint provides `hidden` and `failed` counts
   - More accurate total counts
   - Better visibility into all registration statuses

5. **Free-Form Language Search**
   - AI can understand natural language queries about events
   - Search by date, day of week, event name
   - Examples: "events on Thursday last month", "Cappella events next week"

6. **Birthdate Field**
   - Participant responses include `birthdate` field for filtering
   - Enables birthday-based queries and filtering
   - Companions inherit birthdate from primary order

7. **Salesman Statistics with Tracking Links**
   - `get_salesman_statistics` automatically includes both salesmen and tracking links
   - Tracking links are treated as salesmen for statistics purposes
   - Each tracking link shows:
     - Views, free registrations, paid registrations (calculated from revenue)
     - Total revenue and hidden registrations count
     - Link name, identifier, and referer information
   - Results are sorted by total registrations (free + paid)
   - Summary includes aggregated statistics from both salesmen and tracking links

---

*Last updated: December 9, 2025 - Added tracking links support to salesman statistics*

