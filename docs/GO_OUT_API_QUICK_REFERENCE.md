# Go-Out API - Quick Reference Guide

> A simplified overview of the Go-Out ticketing integration for building an MCP server.

---

## 🔑 Authentication

**Current method**: JWT Bearer Token in headers

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

**⚠️ Note**: Token is currently hardcoded and expires. Need to implement proper login flow.

---

## 📡 API Endpoints

**Base URL**: `https://www.go-out.co/endOne/`

### Events

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all events | POST | `/events/getMyEvents` |
| Get event tickets | GET | `/loadEventTicketsTest?eventUrl={url}` |

### Participants

| Action | Method | Endpoint |
|--------|--------|----------|
| Get participants | POST | `/getEventParticipants/` |
| Get participant count | POST | `/getTotalParticipants/` |
| Download CSV report | POST | `/getUserCSVFilesByStatus` |

### Statistics

| Action | Method | Endpoint |
|--------|--------|----------|
| Get ticket stats | POST | `/getUserTicketStatistics/` |
| Get participants stats | GET | `/getParticipantsStatistic/?eventId={id}` |

### Registration

| Action | Method | Endpoint |
|--------|--------|----------|
| Register user | POST | `/addUsersToEventPending?eventName={name}&eventId={id}` |

---

## 📦 Main Request Examples

### Get Events
```javascript
POST /events/getMyEvents

Body: {
  skip: 0,              // pagination offset
  search: "",           // search filter
  status: true,         // true = active, false = inactive
  currentDate: "2024-01-15T12:00:00.000Z"
}
```

### Get Participants
```javascript
POST /getEventParticipants/

Body: {
  eventId: "abc123",
  limit: 50,
  skip: 0,
  status: "All",        // All | Pending | Accepted | Rejected | Hidden
  userOnly: false,
  hidden: false
}
```

### Register User
```javascript
POST /addUsersToEventPending?eventName={name}&eventId={id}&users=[0,1]

Body: [{
  first_name: "John",
  last_name: "Doe",
  phone_number: "0521234567",
  birthdate: "1990-01-15",
  gender: "זכר",
  age: 34,
  ticketName: "Free Entry"
}]
```

---

## 📊 Data Models (Simplified)

### Event
```
- _id: string
- Title: string
- Url: string
- StartingDate: date
- statistics:
    - Accepted: number
    - Pending: number
    - Rejected: number
    - Hidden: number
```

### Participant
```
- _id: string
- first_name: string
- last_name: string
- phone_number: string
- gender: string
- status: "Pending" | "Accepted" | "Rejected" | "Hidden"
- birthdate: date
- ref: string (salesman phone)
- meta: array (companions in same order)
```

### Status Values
```
- All
- Pending
- Accepted
- Rejected
- Hidden
```

---

## ⏱️ Rate Limits

| Scenario | Limit |
|----------|-------|
| Fetching participants | 50 requests, then wait 10 seconds |
| Registering users | 1 every 20 seconds |
| Fetching events | 5 pages in parallel |

---

## 📁 Key Files in Codebase

```
backend/goOut/
├── api/
│   ├── events.js      # Event API calls
│   └── users.js       # Participant API calls
├── services/
│   ├── events.js      # Event logic
│   ├── users.js       # User logic
│   ├── reports.js     # Reports (tables, birthdays)
│   └── statistics.js  # Stats
├── consts/
│   └── goOutEndpoints.js  # All API URLs
└── helpers/
    └── authentication.js  # Token handling

registerUsers/
└── autoRegister.js    # Auto-registration script
```

---

## 🔧 Recommended MCP Tools

### Priority 1 - Core
| Tool | Description |
|------|-------------|
| `getEvents` | List events (active/inactive) |
| `getParticipants` | Get event participants |
| `getEventStats` | Get ticket statistics |

### Priority 2 - Reports
| Tool | Description |
|------|-------------|
| `getTableReport` | Users wanting reserved seating |
| `getBirthdayReport` | Birthday list for date range |
| `downloadParticipantsCSV` | Export participant data |

### Priority 3 - Actions
| Tool | Description |
|------|-------------|
| `registerParticipant` | Register user to event |
| `getApprovalSuggestions` | AI-powered approve/hide suggestions |

### Missing (Need Go-Out confirmation)
| Tool | Description |
|------|-------------|
| `updateParticipantStatus` | Approve/Reject/Hide |
| `getTicketQR` | Generate QR code |
| `scanTicket` | Validate entry |

---

## ❓ What's Missing

These features are **NOT** found in the current codebase:

1. ❌ Update participant status (approve/reject/hide)
2. ❌ QR code generation
3. ❌ Ticket scanning/validation
4. ❌ Send messages to participants
5. ❌ Create/edit events
6. ❌ Refunds/cancellations

**→ Need to confirm these endpoints with Go-Out API team**

---

## 🚀 Quick Start for MCP

```typescript
// 1. Set up authentication
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.GOOUT_TOKEN}`
};

// 2. Fetch events
const events = await fetch('https://www.go-out.co/endOne/events/getMyEvents', {
  method: 'POST',
  headers,
  body: JSON.stringify({ status: true, skip: 0 })
});

// 3. Fetch participants for an event
const participants = await fetch('https://www.go-out.co/endOne/getEventParticipants/', {
  method: 'POST',
  headers,
  body: JSON.stringify({ eventId: 'abc123', limit: 50, status: 'All' })
});
```

---

*See `GO_OUT_API_DOCUMENTATION.md` for full technical details.*

