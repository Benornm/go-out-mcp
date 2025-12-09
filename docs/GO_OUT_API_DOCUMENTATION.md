# Go-Out API Integration - Full Documentation

> **Purpose**: This document provides complete documentation of all Go-Out API calls and ticketing functionality in the Yahatz2 codebase, intended to serve as a foundation for building a dedicated MCP (Model Context Protocol) server for Go-Out ticketing integration.

---

## Table of Contents

1. [Overview](#1-overview)
2. [File Structure & Inventory](#2-file-structure--inventory)
3. [Authentication](#3-authentication)
4. [Go-Out API Endpoints](#4-go-out-api-endpoints)
5. [Data Models](#5-data-models)
6. [Business Logic & Flows](#6-business-logic--flows)
7. [Rate Limiting & Batching](#7-rate-limiting--batching)
8. [Frontend Integration](#8-frontend-integration)
9. [Gaps & Unclear Areas](#9-gaps--unclear-areas)
10. [MCP Specification Draft](#10-mcp-specification-draft)

---

## 1. Overview

### Integration Summary

The Go-Out integration provides functionality for:
- **Event Management**: Fetching, listing, and managing events
- **Participant/User Management**: Fetching participants, tracking status, saving to local DB
- **Ticket Statistics**: Getting ticket statistics and analytics
- **Table Reports**: Generating reports of users who want reserved seating
- **Birthday Reports**: Generating birthday lists from user data
- **Auto-Registration**: Automatically registering users to events
- **Approval System**: Suggesting approve/hide decisions based on user history

### Base URL
```
https://www.go-out.co/endOne/
```

### Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: MongoDB (via Mongoose)
- **HTTP Client**: Axios
- **Frontend**: React with Material-UI, React Query

---

## 2. File Structure & Inventory

### Core Go-Out Files

| File Path | Purpose |
|-----------|---------|
| `backend/goOut/consts/goOutEndpoints.js` | All Go-Out API endpoint URLs |
| `backend/goOut/consts/consts.js` | Constants (statuses, salesman mappings) |
| `backend/goOut/consts/login.js` | Login credentials |
| `backend/goOut/consts/db.js` | MongoDB connection configuration |
| `backend/goOut/helpers/authentication.js` | Authentication token management |
| `backend/goOut/api/events.js` | Low-level API calls for events |
| `backend/goOut/api/users.js` | Low-level API calls for participants |
| `backend/goOut/services/events.js` | Event business logic |
| `backend/goOut/services/users.js` | User/participant business logic |
| `backend/goOut/services/statistics.js` | Ticket statistics service |
| `backend/goOut/services/reports.js` | Report generation (tables, birthdays) |
| `backend/goOut/services/filters.js` | User filtering logic |
| `backend/goOut/controllers/eventsController.js` | Express controllers |
| `backend/goOut/routes/eventsRoutes.js` | Express routes |
| `backend/goOut/approvalsSystem/approvalSystem.js` | Approval suggestion system |
| `backend/goOut/db/models/event.js` | Event Mongoose model |
| `backend/goOut/db/models/user.js` | User Mongoose model |
| `backend/goOut/personConfiguration.js` | Multi-user configuration |
| `backend/goOut/app.js` | Main application entry point |

### Auto-Registration Module

| File Path | Purpose |
|-----------|---------|
| `registerUsers/autoRegister.js` | Auto-registration logic |
| `registerUsers/consts/events.js` | Event URL builders |
| `registerUsers/consts/consts.js` | Registration headers |
| `registerUsers/helpers.js` | Helper utilities |

### Frontend Files

| File Path | Purpose |
|-----------|---------|
| `frontend/src/api/goOut/events.js` | Frontend API calls |
| `frontend/src/api/goOut/hooks/useGetEvents.js` | React Query hook for events |
| `frontend/src/api/goOut/hooks/useGetTableReport.js` | React Query hook for table reports |
| `frontend/src/components/EventSelector.js` | Event selection UI component |
| `frontend/src/pages/TableReport.js` | Table report page |

---

## 3. Authentication

### Current Implementation

Authentication uses a **JWT Bearer token** that is hardcoded in the codebase.

**File**: `backend/goOut/helpers/authentication.js`

```javascript
const benorToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;

export function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${benorToken}`
    };
}
```

### Token Structure (Decoded JWT)
```json
{
  "userId": "61d30e29d3901860dcf533c7",
  "phone_number": "0527065252",
  "username": "benornm@gmail.com",
  "iat": 1764338658,
  "exp": 1765548258
}
```

### Login Endpoint (Commented Out)
```
POST https://www.go-out.co/endOne/twoFAlogin
```

**Request Body**:
```json
{
  "username": "email@example.com",
  "password": "password123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "token": "JWT_TOKEN_STRING"
}
```

### ⚠️ Security Note
The current implementation hardcodes credentials and tokens. For MCP implementation:
- Use environment variables
- Implement proper token refresh logic
- Handle 2FA flow if required

---

## 4. Go-Out API Endpoints

### 4.1 Login (2FA)

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/twoFAlogin` |
| **Method** | POST |
| **File** | `backend/goOut/consts/goOutEndpoints.js` |
| **Status** | Not fully implemented (commented out) |

---

### 4.2 Get My Events

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/events/getMyEvents?` |
| **Method** | POST |
| **File** | `backend/goOut/api/events.js` → `fetchEventsPage()` |

**Request Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body**:
```json
{
  "skip": 0,
  "search": "",
  "status": true,
  "currentDate": "2024-01-15T12:00:00.000Z"
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `skip` | number | Pagination offset |
| `search` | string | Search filter for event titles |
| `status` | boolean | `true` for active events, `false` for inactive |
| `currentDate` | ISO string | Current date for filtering |

**Response Schema** (inferred):
```json
{
  "events": [
    {
      "_id": "string",
      "Title": "string",
      "StartingDate": "ISO date string",
      "EndingDate": "ISO date string",
      "Url": "string",
      "Adress": "string",
      "CoverImageTimestamp": "number",
      "userRole": "string",
      "EventSerial": "number",
      "SeasonPassEvent": "boolean",
      "SeasonPassSale": "boolean",
      "FullDate": {
        "starting": {
          "time": { "minutes": "string", "hours": "string" },
          "date": { "day": "string", "month": "string", "year": "string", "year_short": "string" }
        },
        "ending": {
          "time": { "minutes": "string", "hours": "string" },
          "date": { "day": "string", "month": "string", "year": "string", "year_short": "string" }
        }
      },
      "EventCurrency": {
        "currency": "string",
        "signature": "string",
        "local_name": "string"
      },
      "statistics": {
        "Accepted": "number",
        "Rejected": "number",
        "Pending": "number",
        "TablePending": "number",
        "TableAccepted": "number",
        "TableRejected": "number",
        "TablePendingOrders": "number",
        "TableAcceptedOrders": "number",
        "TableRejectedOrders": "number",
        "Abandoned": "number",
        "Today": "number"
      }
    }
  ]
}
```

---

### 4.3 Get Single Event (Initial Event)

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/eventManagement/initialEvent?` |
| **Method** | GET (assumed) |
| **File** | `backend/goOut/consts/goOutEndpoints.js` |
| **Status** | Defined but not actively used in code |

**Query Parameters**:
- `eventId` - The event ID

---

### 4.4 Get Event Participants

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/getEventParticipants/?` |
| **Method** | POST |
| **File** | `backend/goOut/api/users.js` → `fetchParticipants()` |

**Request Body**:
```json
{
  "eventId": "string",
  "limit": 50,
  "skip": 0,
  "status": "All",
  "userOnly": false,
  "hidden": false
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | string | Event ID |
| `limit` | number | Number of participants per page (default: 50) |
| `skip` | number | Pagination offset |
| `status` | string | Filter: "All", "Pending", "Accepted", "Rejected", "Hidden" |
| `userOnly` | boolean | Fetch only main users (not meta/companions) |
| `hidden` | boolean | Include hidden participants |

**Response Schema** (inferred from code):
```json
[
  {
    "_id": "string",
    "phone_number": "string",
    "first_name": "string",
    "last_name": "string",
    "age": "number",
    "gender": "string",
    "birthdate": "ISO date string",
    "mail": "string",
    "status": "string",
    "hidden": "boolean",
    "order_date": "ISO date string",
    "payed_to_venue": "number",
    "ref": "string",
    "ref_first_name": "string",
    "ref_last_name": "string",
    "ticket_type": "string",
    "ticket_price": "number",
    "ticket_id": "number",
    "ticket_index": "number",
    "ticket_name": "string",
    "ticketRound": "number",
    "coupon_discount": "number",
    "full_discount": "boolean",
    "facebook_link": "string",
    "instagram_link": "string",
    "city": "string",
    "has_ref": "boolean",
    "meta": [
      {
        "_id": "string",
        "first_name": "string",
        "last_name": "string",
        "gender": "string"
      }
    ],
    "changeLogs": [
      {
        "previous_status": "string",
        "new_status": "string",
        "time_stamp": "ISO date string",
        "operator": {
          "first_name": "string",
          "last_name": "string",
          "phone_number": "string"
        }
      }
    ]
  }
]
```

---

### 4.5 Get Total Participants Count

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/getTotalParticipants/?` |
| **Method** | POST |
| **File** | `backend/goOut/api/users.js` → `getHiddenParticipantsCount()` |

**Request Body**:
```json
{
  "status": "Hidden",
  "statusFilter": "Hidden",
  "eventId": "string"
}
```

**Response Schema**:
```json
{
  "users": "number"
}
```

---

### 4.6 Get Ticket Statistics

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/getUserTicketStatistics/?` |
| **Method** | POST |
| **File** | `backend/goOut/services/statistics.js` → `getTicketsStatistics()` |

**Request Body**:
```json
{
  "eventId": "string"
}
```

**Response Schema**:
```json
{
  "Accepted": "number",
  "Pending": "number",
  "Rejected": "number",
  "Total": "number"
}
```

---

### 4.7 Get Participants Statistic

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/getParticipantsStatistic/?eventId={eventId}` |
| **Method** | GET |
| **File** | `backend/goOut/api/events.js` → `fetchEventParticipantsStatistic()` |

**Query Parameters**:
- `eventId` - The event ID

**Response Schema** (inferred):
```json
{
  "Accepted": "number",
  "Pending": "number",
  "Rejected": "number"
}
```

---

### 4.8 Get User CSV Files By Status (Report Download)

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/getUserCSVFilesByStatus?` |
| **Method** | POST |
| **File** | `backend/goOut/services/reports.js` → `getParticipantsByEventId()` |

**Request Body**:
```json
{
  "eventId": "string",
  "status": "Accepted"
}
```

**Response Schema**:
```json
{
  "link": "string (URL to download CSV/Excel file)"
}
```

The downloaded file contains columns including:
- `first_name`, `last_name`
- `phone_number`
- `age`, `gender`, `date of birth`
- `Salesman`
- `facebook_link`, `instagram_link`
- Custom fields like `האם אתם מעוניינים במקומות ישיבה?` (wants table question)

---

### 4.9 Load Event Ticket Types

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/loadEventTicketsTest?eventUrl={eventUrl}` |
| **Method** | GET |
| **File** | `backend/goOut/api/events.js` → `fetchEventTicketTypes()` |

**Query Parameters**:
- `eventUrl` - The event URL slug

**Response Schema** (inferred):
```json
{
  "tickets": [
    {
      "Title": "string",
      "Active": "boolean",
      "Price": "number"
    }
  ]
}
```

---

### 4.10 Add Users to Event (Registration)

| Property | Value |
|----------|-------|
| **Endpoint** | `https://www.go-out.co/endOne/addUsersToEventPending?eventName={name}&eventId={id}&users=[0,1]&holdToken=undefined` |
| **Method** | POST |
| **File** | `registerUsers/autoRegister.js` → `sendSingleRegister()` |

**Headers** (from `registerUsers/consts/consts.js`):
```json
{
  "accept": "*/*",
  "accept-language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
  "content-type": "application/json",
  "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"macOS\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "cookie": "<session cookies>",
  "Referer": "https://www.go-out.co/event/{eventId}?ref={refId}",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

**Query Parameters**:
- `eventName` - URL-encoded event name
- `eventId` - Event ID
- `users` - Array indicator `[0,1]`
- `holdToken` - Hold token (can be "undefined")

**Request Body**:
```json
[
  {
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string",
    "birthdate": "ISO date string",
    "gender": "string",
    "age": "number",
    "order_date": "ISO date string",
    "ticketName": "string",
    "mail": "string (optional)",
    "instagram_link": "string (optional)",
    "facebook_link": "string (optional)"
  }
]
```

---

## 5. Data Models

### 5.1 Event Model

**File**: `backend/goOut/db/models/event.js`

```javascript
const eventSchema = new Schema({
    _id: { type: String, required: true, index: true },
    Title: String,
    StartingDate: { type: 'string', format: 'date-time' },
    EndingDate: { type: 'string', format: 'date-time' },
    Url: String,
    Adress: String,
    CoverImageTimestamp: Number,
    userRole: String,
    EventSerial: Number,
    SeasonPassEvent: Boolean,
    SeasonPassSale: Boolean,
    FullDate: {
        starting: {
            time: { minutes: String, hours: String },
            date: { day: String, month: String, year: String, year_short: String }
        },
        ending: {
            time: { minutes: String, hours: String },
            date: { day: String, month: String, year: String, year_short: String }
        }
    },
    EventCurrency: {
        currency: String,
        signature: String,
        local_name: String
    },
    statistics: {
        Accepted: Number,
        Rejected: Number,
        Pending: Number,
        TablePending: Number,
        TableAccepted: Number,
        TableRejected: Number,
        TablePendingOrders: Number,
        TableAcceptedOrders: Number,
        TableRejectedOrders: Number,
        Abandoned: Number,
        Today: Number,
        Hidden: Number
    },
    newUsers: Number,
    returnedUsers: Number,
    eventDuplicationUsers: Number,
    duplicatedPhoneNumberWithDifferentName: Number
});
```

### 5.2 User Model

**File**: `backend/goOut/db/models/user.js`

```javascript
const userSchema = new Schema({
    _id: String,
    age: Number,
    phone_number: { type: 'string', required: true, index: true },
    birthdate: Date,
    first_name: String,
    last_name: String,
    gender: String,
    events: [{
        eventId: String,
        eventTitle: String,
        eventDate: { type: 'string', format: 'date-time' },
        ref_name: String,
        ref: String,
        isHidden: Boolean,
        status: String,
        paid_to_venue: Number,
        time_paid: String,
        paid_after_start: Boolean
    }],
    ref: String,
    ref_first_name: String,
    ref_last_name: String,
    mail: String,
    ticket_type: String,
    ticket_price: String,
    ticket_id: Number,
    ticket_index: Number,
    ticket_name: String,
    ticketRound: Number,
    phone_number_code: String,
    status: String,
    order_date: String,
    coupon_discount: Number,
    full_discount: Boolean,
    facebook_link: String,
    instagram_link: String,
    city: String,
    payed_to_venue: Number,
    additionl_data_checkbox: Boolean,
    has_ref: Boolean,
    extra_information_terms: Boolean,
    hidden: Boolean,
    changeLogs: [{
        previous_status: String,
        new_status: String,
        time_stamp: String,
        operator: {
            first_name: String,
            last_name: String,
            phone_number: String
        }
    }]
});
```

### 5.3 Participant Status Enum

**File**: `backend/goOut/consts/consts.js`

```javascript
const participantsStatus = {
    ALL: 'All',
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    HIDDEN: 'Hidden',
};
```

### 5.4 Recommendation Types

```javascript
const PARTICIPANTS_RECOMMENDATION = {
    APPROVE: 'Approve',
    HIDE: 'Hide',
    UNKNOWN: 'Unknown',
    NEW_USER: 'New_User',
};
```

---

## 6. Business Logic & Flows

### 6.1 Fetch All Events Flow

**File**: `backend/goOut/services/events.js`

```
getAllEvents({isGetActiveEvents, search, limitEvents, regexFilter})
    └── fetchAllEvents(isGetActiveEvents, search, limitEvents)
        └── Parallel requests (5 pages at a time)
            └── fetchEventsPage({skip, search, status, currentDate})
                └── POST /endOne/events/getMyEvents
    └── Filter by regexFilter (e.g., 'cappella')
    └── Return filtered events
```

**Batching**: Fetches 5 pages in parallel, 5 events per page (DEFAULT_PAGE_SIZE = 5)

### 6.2 Fetch Event Participants Flow

**File**: `backend/goOut/services/users.js`

```
getEventUsers({event, limit, search, skip, status, userOnly, hidden})
    └── fetchAllParticipants({eventId, totalParticipants, limit, ...})
        └── Rate limiting: Sleep 10 seconds after 50 requests
        └── fetchParticipants({eventId, limit, skip, status, userOnly, hidden})
            └── POST /endOne/getEventParticipants
        └── getFlattenParticipants() - Flattens meta participants
    └── getHiddenParticipantsCount(eventId)
        └── POST /endOne/getTotalParticipants
    └── Fetch hidden participants separately
    └── Merge visible + hidden participants
```

### 6.3 Save Users to Database Flow

**File**: `backend/goOut/services/users.js`

```
saveUsers(users, eventDetails)
    └── Get existing users from DB by phone numbers
    └── For each user:
        └── processUser(user, eventDetails, existingUsers, counter)
            └── Check if phone number matches different name (skip)
            └── handleExistingUser() - Update events array
            └── handleNewUser() - Insert new user with validated birthdate
    └── Return counts: {newUsers, returnedUsers, eventDuplicationUsers}
```

### 6.4 Table Report Flow

**File**: `backend/goOut/services/reports.js`

```
getTableReportData(eventId, status)
    └── getParticipantsByEventId(eventId, status)
        └── POST /endOne/getUserCSVFilesByStatus
        └── GET {downloadLink} - Download Excel file
        └── Parse Excel with XLSX library
    └── Filter users who want tables (isUserWantsTable())
    └── Group by Salesman
    └── Transform data for frontend
    └── Sort by user count per salesman
```

### 6.5 Birthday Report Flow

**File**: `backend/goOut/services/reports.js`

```
getBdaysReport(bdayDateObj, salesmanNumbers, exportToExcel)
    └── getUsersBetweenDates(startDay, startMonth, endDay, endMonth)
        └── MongoDB query with date expressions
    └── Transform users to birthday format
    └── Sort by birthday date
    └── Generate text report
    └── Export to Excel (optional)
```

### 6.6 Approval Suggestion Flow

**File**: `backend/goOut/approvalsSystem/approvalSystem.js`

```
suggestDecisions({eventId, showOnlySingleOrder, checkInAllParticipants, checkOnlyPending, checkOnlyHidden})
    └── fetchEventParticipantsStatistic(eventId)
        └── GET /endOne/getParticipantsStatistic
    └── getEventUsers({event, status})
    └── Filter by pending/hidden status
    └── For each participant:
        └── getUserRecommendationByPhone(user)
            └── Query local DB for user history
            └── Calculate approval ratio (accepted vs hidden)
            └── Recommend: APPROVE (>70%), HIDE (<30%), UNKNOWN (30-70%)
    └── Group by recommendation
    └── Print summary
```

### 6.7 Auto-Registration Flow

**File**: `registerUsers/autoRegister.js`

```
main()
    └── selectEvent() - Interactive event selection
    └── registerAll(peopleList, selectedEvent)
        └── fetchEventTicketTypes(eventUrl)
            └── GET /endOne/loadEventTicketsTest
        └── Find free ticket type
        └── For each person (with delays):
            └── getDataAndSendToRegister(person, index, eventUrl, ticketName)
                └── Check if already registered (log file)
                └── sendSingleRegister(peopleData, eventUrl)
                    └── POST /endOne/addUsersToEventPending
```

**Throttling**: 20 second delay between each registration

---

## 7. Rate Limiting & Batching

### Current Implementation

| Scenario | Limit | Action |
|----------|-------|--------|
| Fetching participants | 50 requests | Sleep 10 seconds |
| Fetching events | 5 pages parallel | Per batch |
| Auto-registration | 1 per 20 seconds | Sequential with timeout |
| Processing events | 10 seconds per event | Sleep between events |

**From `backend/goOut/services/users.js`**:
```javascript
export const DEFAULT_LIMIT = 50;
export const SLEEP_TIME = 10000;  // 10 seconds
export const REQUEST_LIMIT = 50;  // Maximum requests before sleep
```

### Pagination

- Events: 5 per page (DEFAULT_PAGE_SIZE)
- Participants: 50 per request (DEFAULT_LIMIT)

---

## 8. Frontend Integration

### Backend API Routes

**File**: `backend/goOut/routes/eventsRoutes.js`

| Route | Method | Handler | Description |
|-------|--------|---------|-------------|
| `/api/events/active` | GET | `getActiveEvents` | Get active events |
| `/api/events/non-active` | GET | `getNonActiveEvents` | Get non-active events |
| `/api/events/:eventId/table-report` | GET | `getTableReport` | Get table report data |

### Frontend API Functions

**File**: `frontend/src/api/goOut/events.js`

```javascript
export const fetchActiveEvents = async () => {
    const res = await axios.get('/api/events/active');
    return res.data.events;
};

export const fetchNonActiveEvents = async () => {
    const res = await axios.get('/api/events/non-active');
    return res.data.events;
};

export const fetchTableReportData = async (eventId) => {
    const res = await axios.get(`/api/events/${eventId}/table-report`);
    return res.data;
};
```

### React Query Hooks

**File**: `frontend/src/api/goOut/hooks/useGetEvents.js`

```javascript
const useGetEvents = (isActive = true) => {
    return useQuery({
        queryKey: [isActive ? QUERY_KEYS.ACTIVE_EVENTS : QUERY_KEYS.NON_ACTIVE_EVENTS],
        queryFn: isActive ? fetchActiveEvents : fetchNonActiveEvents,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
    });
};
```

---

## 9. Gaps & Unclear Areas

### 9.1 Missing API Endpoints (Not Found in Code)

| Functionality | Likely Endpoint | Notes |
|---------------|-----------------|-------|
| Update participant status | Unknown | No approve/reject/hide API found |
| Get ticket QR code | Unknown | No QR code generation |
| Send messages to participants | Unknown | Not implemented |
| Refund/cancel order | Unknown | Not implemented |
| Update event details | Unknown | Not implemented |
| Create new event | Unknown | Not implemented |
| Delete event | Unknown | Not implemented |
| Get order details | Unknown | Only batch export available |
| Scan ticket | Unknown | Not implemented |

### 9.2 Authentication Issues

- **Token expiration**: Hardcoded tokens will expire
- **2FA flow**: Login endpoint exists but not implemented
- **Refresh token**: No refresh mechanism found
- **Multi-user**: Different tokens needed for different accounts

### 9.3 Incomplete Implementations

1. **Login function** (`authentication.js`): Commented out, incomplete
2. **Single event fetch** (`singleEventUrl`): Defined but not used
3. **Participant status update**: No mutation endpoints found
4. **QR code generation**: Not found in codebase

### 9.4 Data Model Gaps

- `scanned` field mentioned in code but not in schema
- Payment validation (paid after start) logic exists but unclear source

### 9.5 Questions for Go-Out API Team

1. How to properly authenticate with 2FA?
2. What is the token refresh mechanism?
3. How to update participant status (approve/reject/hide)?
4. How to get/generate QR codes for tickets?
5. How to scan/validate tickets?
6. Is there a webhook/websocket for real-time updates?
7. What are the official rate limits?
8. How to get individual order details?
9. How to send notifications to participants?

---

## 10. MCP Specification Draft

### 10.1 Recommended MCP Tools

#### Event Management Tools

```typescript
// Tool: getEvents
{
  name: "getEvents",
  description: "Fetch list of events with optional filters",
  inputSchema: {
    type: "object",
    properties: {
      isActive: { type: "boolean", description: "Filter by active status" },
      search: { type: "string", description: "Search term for event title" },
      limit: { type: "number", description: "Maximum events to return" },
      skip: { type: "number", description: "Pagination offset" }
    }
  },
  outputSchema: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        date: { type: "string" },
        url: { type: "string" },
        statistics: {
          type: "object",
          properties: {
            accepted: { type: "number" },
            pending: { type: "number" },
            rejected: { type: "number" }
          }
        }
      }
    }
  }
}

// Tool: getEventDetails
{
  name: "getEventDetails",
  description: "Get detailed information about a specific event",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true }
    }
  }
}
```

#### Participant Management Tools

```typescript
// Tool: getParticipants
{
  name: "getParticipants",
  description: "Fetch participants for an event with filters",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true },
      status: { 
        type: "string", 
        enum: ["All", "Pending", "Accepted", "Rejected", "Hidden"] 
      },
      limit: { type: "number", default: 50 },
      skip: { type: "number", default: 0 },
      includeHidden: { type: "boolean", default: false }
    }
  }
}

// Tool: getParticipantsByStatus
{
  name: "getParticipantsByStatus",
  description: "Download participant report by status (CSV)",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true },
      status: { type: "string", enum: ["Accepted", "Pending", "Rejected"] }
    }
  }
}

// Tool: updateParticipantStatus (TO BE IMPLEMENTED)
{
  name: "updateParticipantStatus",
  description: "Update participant status (approve/reject/hide)",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true },
      participantId: { type: "string", required: true },
      newStatus: { type: "string", enum: ["Accepted", "Rejected", "Hidden"] }
    }
  }
}
```

#### Statistics Tools

```typescript
// Tool: getEventStatistics
{
  name: "getEventStatistics",
  description: "Get ticket statistics for an event",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true }
    }
  },
  outputSchema: {
    type: "object",
    properties: {
      accepted: { type: "number" },
      pending: { type: "number" },
      rejected: { type: "number" },
      total: { type: "number" }
    }
  }
}

// Tool: getParticipantsStatistics
{
  name: "getParticipantsStatistics",
  description: "Get participant statistics including hidden count",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true }
    }
  }
}
```

#### Report Tools

```typescript
// Tool: getTableReport
{
  name: "getTableReport",
  description: "Get report of users who want reserved seating",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true }
    }
  },
  outputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string" },
      statistics: {
        type: "object",
        properties: {
          totalParticipants: { type: "number" },
          usersWantingTables: { type: "number" },
          tableRequestRatio: { type: "string" }
        }
      },
      salesmanData: {
        type: "object",
        additionalProperties: {
          type: "array"
        }
      }
    }
  }
}

// Tool: getBirthdayReport
{
  name: "getBirthdayReport",
  description: "Get birthday report for date range",
  inputSchema: {
    type: "object",
    properties: {
      startDay: { type: "number", required: true },
      startMonth: { type: "number", required: true },
      endDay: { type: "number", required: true },
      endMonth: { type: "number", required: true },
      salesmanNumbers: { type: "array", items: { type: "string" } }
    }
  }
}
```

#### Registration Tools

```typescript
// Tool: registerParticipant
{
  name: "registerParticipant",
  description: "Register a participant to an event",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true },
      eventName: { type: "string", required: true },
      participant: {
        type: "object",
        properties: {
          firstName: { type: "string", required: true },
          lastName: { type: "string", required: true },
          phoneNumber: { type: "string", required: true },
          birthdate: { type: "string", required: true },
          gender: { type: "string", required: true },
          email: { type: "string" },
          ticketName: { type: "string" }
        }
      }
    }
  }
}

// Tool: getEventTicketTypes
{
  name: "getEventTicketTypes",
  description: "Get available ticket types for an event",
  inputSchema: {
    type: "object",
    properties: {
      eventUrl: { type: "string", required: true }
    }
  }
}
```

#### Suggestion/AI Tools

```typescript
// Tool: getApprovalSuggestions
{
  name: "getApprovalSuggestions",
  description: "Get AI-powered approval suggestions based on user history",
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", required: true },
      checkOnlyPending: { type: "boolean", default: true },
      checkOnlyHidden: { type: "boolean", default: false }
    }
  },
  outputSchema: {
    type: "object",
    properties: {
      approve: { type: "array" },
      hide: { type: "array" },
      unknown: { type: "array" },
      newUsers: { type: "array" },
      summary: {
        type: "object",
        properties: {
          approveCount: { type: "number" },
          hideCount: { type: "number" },
          unknownCount: { type: "number" },
          helpRatio: { type: "string" }
        }
      }
    }
  }
}
```

### 10.2 MCP Folder Structure

```
mcp-goout-server/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── config/
│   │   ├── constants.ts            # API endpoints, defaults
│   │   └── env.ts                  # Environment variable handling
│   ├── auth/
│   │   ├── authentication.ts       # Token management
│   │   └── login.ts                # Login flow with 2FA
│   ├── api/
│   │   ├── client.ts               # Axios instance with auth
│   │   ├── events.ts               # Event API calls
│   │   ├── participants.ts         # Participant API calls
│   │   ├── statistics.ts           # Statistics API calls
│   │   └── registration.ts         # Registration API calls
│   ├── tools/
│   │   ├── index.ts                # Tool registry
│   │   ├── events.ts               # Event tools
│   │   ├── participants.ts         # Participant tools
│   │   ├── reports.ts              # Report tools
│   │   ├── statistics.ts           # Statistics tools
│   │   ├── registration.ts         # Registration tools
│   │   └── suggestions.ts          # AI suggestion tools
│   ├── types/
│   │   ├── event.ts                # Event types
│   │   ├── participant.ts          # Participant types
│   │   ├── api.ts                  # API response types
│   │   └── mcp.ts                  # MCP-specific types
│   ├── utils/
│   │   ├── rateLimiter.ts          # Rate limiting logic
│   │   ├── pagination.ts           # Pagination helpers
│   │   ├── dateHelpers.ts          # Date utilities
│   │   └── validators.ts           # Input validation
│   └── resources/
│       ├── index.ts                # Resource handlers
│       └── events.ts               # Event resources
├── tests/
│   ├── api/
│   ├── tools/
│   └── utils/
└── examples/
    └── usage.md
```

### 10.3 Throttling & Batching Rules

```typescript
const RATE_LIMITS = {
  // Participant fetching
  PARTICIPANTS_PER_REQUEST: 50,
  PARTICIPANT_REQUESTS_BEFORE_PAUSE: 50,
  PARTICIPANT_PAUSE_DURATION_MS: 10000,
  
  // Event fetching
  EVENTS_PER_PAGE: 5,
  CONCURRENT_EVENT_PAGES: 5,
  
  // Registration
  REGISTRATION_DELAY_MS: 20000,
  
  // General
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  REQUEST_TIMEOUT_MS: 30000
};

// Implement exponential backoff for 429 errors
const exponentialBackoff = (attempt: number) => {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
};
```

### 10.4 Environment Variables

```bash
# .env.example
GOOUT_BASE_URL=https://www.go-out.co/endOne
GOOUT_USERNAME=email@example.com
GOOUT_PASSWORD=your_password
GOOUT_TOKEN=jwt_token_here

# Rate limiting
GOOUT_REQUESTS_PER_MINUTE=100
GOOUT_CONCURRENT_REQUESTS=5

# Database (optional, for local caching)
MONGODB_URI=mongodb://localhost:27017/goout-mcp
```

### 10.5 Error Handling Strategy

```typescript
enum GoOutErrorCode {
  UNAUTHORIZED = 'GOOUT_UNAUTHORIZED',
  RATE_LIMITED = 'GOOUT_RATE_LIMITED',
  NOT_FOUND = 'GOOUT_NOT_FOUND',
  VALIDATION_ERROR = 'GOOUT_VALIDATION_ERROR',
  NETWORK_ERROR = 'GOOUT_NETWORK_ERROR',
  UNKNOWN_ERROR = 'GOOUT_UNKNOWN_ERROR'
}

interface GoOutError {
  code: GoOutErrorCode;
  message: string;
  originalError?: Error;
  retryable: boolean;
}

// Handle specific HTTP status codes
const handleApiError = (status: number, message: string): GoOutError => {
  switch (status) {
    case 401:
      return { code: GoOutErrorCode.UNAUTHORIZED, message, retryable: false };
    case 429:
      return { code: GoOutErrorCode.RATE_LIMITED, message, retryable: true };
    case 404:
      return { code: GoOutErrorCode.NOT_FOUND, message, retryable: false };
    default:
      return { code: GoOutErrorCode.UNKNOWN_ERROR, message, retryable: true };
  }
};
```

---

## Appendix A: Complete API Endpoint Reference

| Endpoint | Method | Purpose | Implemented |
|----------|--------|---------|-------------|
| `/endOne/twoFAlogin` | POST | Login with 2FA | ⚠️ Partial |
| `/endOne/events/getMyEvents` | POST | Get events list | ✅ Yes |
| `/endOne/eventManagement/initialEvent` | GET | Get single event | ⚠️ Defined |
| `/endOne/getEventParticipants/` | POST | Get participants | ✅ Yes |
| `/endOne/getTotalParticipants/` | POST | Get participant count | ✅ Yes |
| `/endOne/getUserTicketStatistics/` | POST | Get ticket stats | ✅ Yes |
| `/endOne/getParticipantsStatistic/` | GET | Get participant stats | ✅ Yes |
| `/endOne/getUserCSVFilesByStatus` | POST | Download CSV report | ✅ Yes |
| `/endOne/loadEventTicketsTest` | GET | Get ticket types | ✅ Yes |
| `/endOne/addUsersToEventPending` | POST | Register users | ✅ Yes |
| Update participant status | ? | Approve/Reject/Hide | ❌ Missing |
| Get QR code | ? | Ticket QR | ❌ Missing |
| Scan ticket | ? | Validate entry | ❌ Missing |

---

## Appendix B: Sample Request/Response Examples

### Fetch Events Example

**Request**:
```bash
curl -X POST 'https://www.go-out.co/endOne/events/getMyEvents?' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "skip": 0,
    "search": "cappella",
    "status": true,
    "currentDate": "2024-01-15T12:00:00.000Z"
  }'
```

### Fetch Participants Example

**Request**:
```bash
curl -X POST 'https://www.go-out.co/endOne/getEventParticipants/?' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "eventId": "abc123",
    "limit": 50,
    "skip": 0,
    "status": "Pending",
    "userOnly": false,
    "hidden": false
  }'
```

---

*Document generated on: December 9, 2025*
*Based on Yahatz2 codebase analysis*

