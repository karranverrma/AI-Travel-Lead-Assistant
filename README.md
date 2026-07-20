# AI-Powered Travel Lead Assistant

An intelligent chatbot application that engages users in natural conversations to understand their travel requirements, extract structured lead information, qualify leads, and store them in a database.

## Overview

The AI Travel Lead Assistant simulates a real travel agent experience through a chat interface. It uses Google's Gemini 2.5 Flash model to understand user intent, extract travel details, and qualify leads based on a deterministic scoring algorithm. Qualified leads are persisted to Supabase for sales team follow-up.

### Key Features

- **Natural Conversation**: Chat-based interface with context-aware responses
- **Progressive Lead Extraction**: Collects destination, dates, travelers, budget, preferences, and contact info
- **Real-time Lead Scoring**: Deterministic 0-100 score based on collected fields
- **Lead Qualification**: Automatically qualifies leads when score reaches threshold
- **Supabase Integration**: Persists qualified leads to PostgreSQL
- **Conversation Memory**: Maintains context across multiple messages with deduplication
- **Edge Case Handling**: Gracefully handles vague dates, refusals, corrections, and abandoned conversations
- **Responsive UI**: Works on desktop and mobile with adaptive layout

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Header     │  │  ChatWindow  │  │    LeadPanel     │  │
│  │              │  │              │  │                  │  │
│  │ - Logo       │  │ - Messages   │  │ - ScoreGauge     │  │
│  │ - New Chat   │  │ - Input      │  │ - Travel Details │  │
│  │ - Status     │  │ - Errors     │  │ - Contact Info   │  │
│  └──────────────┘  └──────────────┘  │ - Status/Summary │  │
│                                      └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes                                                │  │
│  │  POST /api/chat      - Send message, get AI response  │  │
│  │  GET  /api/health    - Health check                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────┼────────────────────────────┐  │
│  │                         ▼                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ Controller  │  │   Service   │  │   Service   │ │  │
│  │  │             │  │             │  │             │ │  │
│  │  │ - Validate  │  │ - Gemini    │  │ - Memory    │ │  │
│  │  │ - Format    │  │ - Extract   │  │ - Dedup     │ │  │
│  │  │ - Error      │  │ - Merge     │  │ - Context   │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │                         │                            │  │
│  │                         ▼                            │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  Lead Service                               │    │  │
│  │  │  - Validate & normalize fields              │    │  │
│  │  │  - Merge strategy (replace/append)          │    │  │
│  │  │  - Deterministic scoring (0-100)            │    │  │
│  │  │  - Save to Supabase (qualified only)        │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Supabase Client
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  leads table                                           │  │
│  │  - conversation_id (UNIQUE)                           │  │
│  │  - destination, travel_date, travellers, budget       │  │
│  │  - customer_name, phone, email                        │  │
│  │  - lead_score, confidence, qualification_status       │  │
│  │  - buying_intent, summary                             │  │
│  │  - created_at, updated_at (auto-updated trigger)      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JS hooks** - State management with `useChat` custom hook

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **@google/genai** - Official Google Gen AI SDK for Gemini 2.5 Flash
- **@supabase/supabase-js** - Supabase client for PostgreSQL
- **dotenv** - Environment variable management

### Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database with RLS

## Folder Structure

```
AI-Travel-Lead-Assistant/
├── client/                          # Frontend React app
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Header.jsx          # App header with logo and controls
│   │   │   ├── ChatWindow.jsx      # Chat message list + input container
│   │   │   ├── MessageBubble.jsx   # Individual message display
│   │   │   ├── MessageInput.jsx    # Text input with send button
│   │   │   ├── TypingIndicator.jsx # AI "thinking" animation
│   │   │   ├── ErrorBanner.jsx     # Error message display
│   │   │   ├── LeadField.jsx       # Single lead data row
│   │   │   └── LeadPanel.jsx       # Right sidebar with lead details
│   │   ├── hooks/
│   │   │   └── useChat.js          # Chat state management (messages, lead, loading, error)
│   │   ├── services/
│   │   │   └── api.js              # HTTP client for backend API
│   │   ├── utils/
│   │   │   └── mockData.js         # (deprecated - removed)
│   │   ├── App.jsx                 # Root component
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Tailwind directives + custom animations
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                          # Backend Express app
│   ├── src/
│   │   ├── config/
│   │   │   ├── gemini.js           # Gemini AI client (lazy singleton)
│   │   │   └── supabase.js         # Supabase client (lazy singleton)
│   │   ├── routes/
│   │   │   ├── chat.routes.js      # POST /api/chat, GET /api/chat/:id
│   │   │   └── lead.routes.js      # (stub for future lead CRUD)
│   │   ├── controllers/
│   │   │   ├── chat.controller.js  # Request validation, response formatting
│   │   │   └── lead.controller.js  # (stub for future lead CRUD)
│   │   ├── services/
│   │   │   ├── gemini.service.js   # Gemini API calls, JSON parsing, retry logic
│   │   │   ├── chat.service.js     # Conversation orchestration, merge, scoring
│   │   │   ├── lead.service.js     # Field validation, merge strategies, DB save
│   │   │   ├── memory.service.js   # Message storage, dedup, provenance, corrections
│   │   │   └── scoring.service.js  # (stub - scoring logic in chat.service)
│   │   ├── prompts/
│   │   │   └── system.prompt.js    # Gemini system prompt with edge case rules
│   │   ├── middleware/
│   │   │   └── errorHandler.js     # AppError, 404, global error handler
│   │   ├── utils/
│   │   │   └── logger.js           # Timestamped, level-based logging
│   │   └── index.js                # Express entry point
│   ├── package.json
│   └── .env                        # (not committed - see .env.example)
│
├── supabase/
│   └── migrations/
│       └── 20240101000000_create_leads_table.sql
│
├── .env.example                     # Environment variable template
├── .gitignore
└── README.md
```

## Lead Scoring Algorithm

The lead score is a deterministic integer from 0 to 100, calculated as the sum of individual field scores:

| Field | Points | Notes |
|-------|--------|-------|
| `destination` | 20 | Required for meaningful lead |
| `travelDate` | 15 | Any date string accepted (vague dates OK) |
| `travellers` | 10 | Number of travelers |
| `budget` | 15 | Budget range or single amount |
| `duration` | 5 | Trip length in days/weeks |
| `tripType` | 10 | Categorized trip type |
| `departureCity` | 5 | Where they're departing from |
| `specialRequirements` | 5 | Any special needs |
| `customerName` | 5 | Contact info - late stage |
| `email` | 10 | Contact info - late stage |
| `phone` | 10 | Contact info - late stage |

**Maximum score: 100**

### Qualification Thresholds

| Score | Confidence | Status | Action |
|-------|-----------|--------|--------|
| 60-100 | High | Qualified | Save to Supabase, alert sales team |
| 40-59 | Medium | In Progress | Continue conversation |
| 0-39 | Low | Exploring | Gather more information |

### Example Score Calculation

```javascript
{
  destination: "Paris, France",      // +20
  travelDate: "July 2026",           // +15
  travellers: 4,                     // +10
  budget: "$6,000 - $8,000",         // +15
  tripType: "Family Vacation",       // +10
  departureCity: "New York",         // +5
  specialRequirements: "Wheelchair", // +5
  // customerName: null,             // +0
  // email: null,                    // +0
  // phone: null,                    // +0
}
// Total: 80/100 → Qualified
```

## Conversation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: GREETING                                          │
│  AI: "Hello! Where are you thinking of going?"              │
│  User: "I want to go to Paris"                              │
│  → destination extracted, score: 20                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: EXPLORATION                                       │
│  AI: "Paris is amazing! When are you planning to travel?"   │
│  User: "July 2026, for 2 weeks"                             │
│  → travelDate, duration extracted, score: 40                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: DETAILING                                         │
│  AI: "How many people will be traveling?"                   │
│  User: "4 people, family vacation"                          │
│  → travellers, tripType extracted, score: 65                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: QUALIFYING                                        │
│  AI: "What's your budget range?"                            │
│  User: "Around $6000-$8000"                                 │
│  → budget extracted, score: 80 → Qualified                  │
│  AI: "I'd love to send you personalized options.            │
│       Could I get your name and email?"                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: QUALIFIED                                         │
│  User: "John Smith, john@example.com"                       │
│  → customerName, email extracted, score: 95                 │
│  → Lead saved to Supabase                                   │
│  AI: "Thanks John! I'll send options to your email."        │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### `leads` Table

```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT UNIQUE NOT NULL,
  destination TEXT,
  departure_city TEXT,
  travel_date TEXT,
  travellers INTEGER,
  budget TEXT,
  duration TEXT,
  trip_type TEXT,
  special_requirements TEXT,
  customer_name TEXT,
  phone TEXT,
  email TEXT,
  lead_score INTEGER DEFAULT 0,
  confidence TEXT DEFAULT 'Low',
  qualification_status TEXT DEFAULT 'Exploring',
  summary TEXT,
  buying_intent TEXT DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_leads_conversation_id` - Fast duplicate checks
- `idx_leads_lead_score DESC` - Query hot leads
- `idx_leads_qualification_status` - Filter by status
- `idx_leads_created_at DESC` - Time-range queries
- `idx_leads_email` (partial) - Dedup by contact

**Triggers:**
- `update_leads_updated_at` - Auto-update `updated_at` on row changes

**RLS Policies:**
- Service role: Full access (backend only)
- Anon: No access (disabled by default)

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google AI Studio account (for Gemini API key)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd AI-Travel-Lead-Assistant

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Frontend
VITE_API_URL=http://localhost:3001/api
```

**Getting API Keys:**

1. **Supabase:**
   - Go to https://supabase.com/dashboard
   - Create a new project
   - Go to Settings → API
   - Copy `URL` → `SUPABASE_URL`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

2. **Gemini:**
   - Go to https://aistudio.google.com/app/apikey
   - Create an API key
   - Copy → `GEMINI_API_KEY`

### 3. Database Migration

Run the migration SQL in your Supabase project:

```bash
# Option 1: Supabase CLI
supabase migration up

# Option 2: Manual
# Copy supabase/migrations/20240101000000_create_leads_table.sql
# Paste into Supabase Dashboard → SQL Editor → Run
```

### 4. Run the Application

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

## Installation & Run

### Development Mode

```bash
# Backend (with auto-reload)
cd server
npm run dev

# Frontend (with hot reload)
cd client
npm run dev
```

### Production Mode

```bash
# Build frontend
cd client
npm run build

# Start backend
cd server
npm start
```

## Assumptions

1. **Gemini API Availability**: The application requires a valid Gemini API key. Without it, the chat will return a configuration error message.

2. **Supabase Optional**: The application works without Supabase configured. Leads will be stored in memory only (lost on server restart). Supabase is required for production persistence.

3. **Single Conversation Per Session**: Each browser session starts a new conversation. The `conversationId` is stored in a React ref and persists across page reloads only if the ref survives (it doesn't - new session = new conversation).

4. **No User Authentication**: The application does not implement user authentication. All conversations are anonymous. The `conversation_id` field prevents duplicate lead inserts but does not identify individual users.

5. **Qualified Leads Only**: Only leads with `qualificationStatus === 'Qualified'` (score >= 60) are saved to Supabase. Lower-scoring leads are discarded.

6. **Fire-and-Forget DB Saves**: Database writes are non-blocking. If the DB save fails, the chat response is still returned to the user. Errors are logged but not surfaced to the user.

7. **In-Memory Conversation Store**: Conversations are stored in a `Map` in `chat.service.js`. This means:
   - Conversations are lost on server restart
   - Only one server instance can be run (no clustering)
   - Memory usage grows with conversation count

8. **Vague Dates Accepted**: The system accepts vague travel dates like "Spring 2026", "Next year", "Sometime in July". No date validation or normalization is performed.

9. **No Lead Editing UI**: Once a lead is saved to Supabase, there is no UI to edit it. The `updateLeadInDatabase` function exists in `lead.service.js` but is not called from anywhere.

10. **Single Language**: The system prompt and UI are English-only. No internationalization is implemented.

## Limitations

1. **No Real-Time Updates**: The lead panel updates only when the user sends a message. There is no WebSocket or polling for real-time score changes.

2. **No Lead Management UI**: There is no admin interface to view, search, or manage saved leads. Leads can only be viewed directly in Supabase.

3. **No Conversation History**: Once a conversation is reset or the server restarts, all history is lost. There is no way to resume a previous conversation.

4. **No Rate Limiting**: The API has no rate limiting. A malicious user could spam the `/api/chat` endpoint and exhaust the Gemini API quota.

5. **No Input Sanitization**: User messages are not sanitized for XSS. While React escapes content by default, the backend does not sanitize before storing in memory.

6. **No Pagination**: The message list loads all messages at once. For very long conversations (100+ messages), this could cause performance issues.

7. **No Offline Support**: The application requires an active internet connection. There is no service worker or offline caching.

8. **Gemini-Only AI**: The application is tightly coupled to Gemini 2.5 Flash. Switching to a different AI provider would require significant refactoring.

9. **No Testing**: No unit tests, integration tests, or E2E tests are implemented.

10. **No CI/CD**: No automated testing, building, or deployment pipeline is configured.

## API Reference

### POST /api/chat

Send a message and receive an AI response with extracted lead data.

**Request:**
```json
{
  "conversationId": "optional-string",
  "message": "I want to go to Paris with my family"
}
```

**Response:**
```json
{
  "reply": "Paris is amazing! When are you planning to travel?",
  "lead": {
    "destination": "Paris, France",
    "departureCity": null,
    "travelDate": null,
    "travellers": null,
    "budget": null,
    "duration": null,
    "tripType": "Family Vacation",
    "specialRequirements": null,
    "customerName": null,
    "phone": null,
    "email": null,
    "leadScore": 30,
    "confidence": "Medium",
    "qualificationStatus": "In Progress",
    "summary": "Trip to Paris, France (Family Vacation)."
  },
  "conversationId": "conv_1700000000000_abc123"
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-20T09:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

## Error Handling

### Client-Side Errors

| Error | User Message | Action |
|-------|--------------|--------|
| Empty message | "Message is required" | Show error banner, allow retry |
| Network failure | "Unable to reach the server. Please check your connection and try again." | Show error banner, allow retry |
| Timeout (>15s) | "Request timed out. Please try again." | Show error banner, allow retry |
| Server error (5xx) | "Something went wrong: [message]" | Show error banner, allow retry |

### Server-Side Errors

| Error | Log Level | Action |
|-------|-----------|--------|
| Gemini API failure | ERROR | Return fallback message, log error |
| Supabase save failure | ERROR | Log error, don't fail request |
| Invalid request (400) | WARN | Return validation error |
| Route not found (404) | WARN | Return 404 JSON |
| Unexpected error | ERROR | Log stack trace, return 500 |

## Performance Considerations

1. **Frontend:**
   - `useMemo` for expensive calculations (timestamp formatting)
   - `useCallback` for event handlers to prevent re-renders
   - Optimistic UI updates for instant feedback
   - CSS animations (GPU-accelerated) for smooth transitions

2. **Backend:**
   - Lazy singleton pattern for Gemini and Supabase clients
   - Fire-and-forget DB saves (non-blocking)
   - Message deduplication to avoid redundant processing
   - Sliding window for conversation history (last 20 messages)
   - Request logging with duration tracking

3. **Database:**
   - Indexes on frequently queried columns
   - Partial index for non-null emails
   - Auto-update trigger for `updated_at` (no application logic needed)

## Security

1. **API Keys:** Stored in environment variables, never committed to git
2. **Supabase Service Role:** Used only on backend, never exposed to frontend
3. **RLS:** Enabled on `leads` table, service role has full access
4. **CORS:** Configured to allow frontend origin only
5. **Input Validation:** All user inputs validated before processing
6. **Error Messages:** Sanitized in production (no stack traces exposed)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.