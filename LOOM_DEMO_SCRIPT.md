# Loom Demonstration Script
## AI-Powered Travel Lead Assistant

**Video Length:** 8-10 minutes  
**Audience:** Technical reviewers, internship evaluators  
**Tone:** Professional, confident, technical but accessible

---

## 📋 Pre-Recording Checklist

- [ ] Backend server running on http://localhost:3001
- [ ] Frontend dev server running on http://localhost:5173
- [ ] Browser window open to http://localhost:5173
- [ ] Terminal windows visible for backend logs
- [ ] Supabase dashboard open (optional, for showing saved leads)
- [ ] Close all unnecessary tabs/applications
- [ ] Set browser zoom to 100%
- [ ] Clear browser cache if needed

---

## 🎬 Script

### **Introduction (0:00 - 0:45)**

**[Camera on]**

"Hi, I'm [Your Name], and this is my AI-Powered Travel Lead Assistant — an intelligent chatbot application that simulates a real travel agent experience.

The application uses Google's Gemini 2.5 Flash AI to understand user intent, extract structured travel information, qualify leads based on a deterministic scoring algorithm, and persist qualified leads to Supabase.

Let me walk you through the architecture, then demonstrate the full user flow."

**[Camera off]**

---

### **Architecture Overview (0:45 - 1:30)**

**[Screen share: Show README.md architecture diagram]**

"The application follows a modern full-stack architecture:

**Frontend:**
- React 18 with Vite for fast development
- Tailwind CSS for responsive, utility-first styling
- Custom hooks for state management
- Real-time lead panel updates

**Backend:**
- Node.js with Express.js
- Google Gen AI SDK for Gemini 2.5 Flash
- Conversation memory with deduplication
- Deterministic lead scoring algorithm

**Database:**
- Supabase (PostgreSQL) for lead persistence
- Only qualified leads (score ≥ 60) are saved

**Key Features:**
- Natural conversation flow with context awareness
- Progressive lead extraction without being pushy
- Real-time lead scoring from 0-100
- Edge case handling: vague dates, refusals, corrections
- Conversation memory with sliding window"

---

### **Backend Demonstration (1:30 - 2:30)**

**[Screen share: Show terminal with backend logs]**

"Let me show you the backend running on port 3001.

**[Point to terminal output]**

You can see:
- Server started successfully on port 3001
- Gemini AI is configured with model gemini-2.5-flash
- Supabase is connected and ready
- Health check endpoint is responding

**[Open browser: http://localhost:3001/api/health]**

Here's the health check endpoint returning a 200 OK with uptime and environment info.

**[Show server logs briefly]**

The backend uses a service-oriented architecture with clear separation of concerns:
- `gemini.service.js` — AI API calls with retry logic
- `chat.service.js` — Conversation orchestration and scoring
- `memory.service.js` — Message storage and deduplication
- `lead.service.js` — Field validation and merge strategies"

---

### **Frontend Demonstration (2:30 - 3:30)**

**[Screen share: Show frontend at http://localhost:5173]**

"Now let's look at the frontend. The application has a clean, responsive interface with two main sections:

**[Point to UI elements]**

**Left side — Chat Interface:**
- Message bubbles with timestamps
- Typing indicator while AI processes
- Text input with send button
- Error banners for connection issues
- New Chat button to reset conversation

**Right side — Lead Panel:**
- Score gauge showing 0-100 points
- Travel details section (destination, dates, travelers, budget)
- Contact information section
- Qualification status and confidence level
- AI-generated summary

The UI is fully responsive and works on mobile devices."

---

### **Live Chat Demonstration (3:30 - 6:30)**

**[Screen share: Show chat interface]**

"Now let me demonstrate the full conversation flow. I'll show you three scenarios:

#### **Scenario 1: Qualified Lead (Family Vacation to Paris)**

**[Type in chat]**
User: "I want to plan a family trip to Paris"

**[Wait for AI response]**

AI: "Paris in July 2026 sounds absolutely lovely for a family trip! With 4 people, you'll have a fantastic time exploring the city. Do you have a budget in mind?"

**[Point to lead panel]**

Notice the lead panel is updating in real-time:
- Destination: Paris, France (+20 points)
- Travel Date: July 2026 (+15 points)
- Travellers: 4 (+10 points)
- **Current Score: 45/100** (In Progress)

**[Continue conversation]**
User: "Around $8,000 to $10,000"

AI: "That's a great budget for a family trip to Paris! Could I get your name and email to send you personalized options?"

**[Point to lead panel]**

- Budget: $8,000 - $10,000 (+15 points)
- **Current Score: 60/100** → **Qualified!**

The lead is now qualified and will be saved to Supabase.

**[Continue]**
User: "I'm John Smith, john@example.com"

AI: "Thanks John! I'll send curated options to your email."

**[Point to lead panel]**

- Customer Name: John Smith (+5 points)
- Email: john@example.com (+10 points)
- **Final Score: 95/100** (Qualified)

The lead has been saved to Supabase with all details."

---

#### **Scenario 2: Edge Case - Vague Dates**

**[Click "New Chat" button]**

"Let me show you how the system handles edge cases. First, vague dates:

**[Type]**
User: "I want to go to Japan"

AI: "Japan is incredible! When are you thinking of going?"

User: "Not sure yet, maybe next year"

**[Point to lead panel]**

Notice:
- Destination: Japan (+20 points)
- Travel Date: Next year (+15 points) — accepted without pressure
- **Score: 35/100** (Exploring)

The AI accepts vague dates gracefully and doesn't pressure the user for exact dates."

---

#### **Scenario 3: Edge Case - Refusal**

**[Continue conversation]**
User: "I don't want to share my phone number"

AI: "No problem at all! We can proceed without it. Is there anything else you'd like to plan?"

**[Point to lead panel]**

Notice:
- Phone: null (not forced)
- Conversation continues naturally
- AI respects the user's decision

The system never overwrites existing values with null and respects user refusals."

---

### **API Demonstration (6:30 - 7:30)**

**[Screen share: Show terminal]**

"Now let me show you the API in action. I'll make a direct API call to demonstrate the backend logic:

**[Type in terminal]**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Planning a honeymoon to Maldives"}'
```

**[Show response]**

The API returns:
- `reply`: AI-generated response
- `lead`: Extracted lead data with score
- `conversationId`: Unique conversation ID

**[Point to backend logs]**

You can see the request being logged with duration and status code.

The API is RESTful, stateless, and returns consistent JSON responses that the frontend can easily consume."

---

### **Lead Scoring Algorithm (7:30 - 8:15)**

**[Screen share: Show lead panel with high score]**

"Let me explain the deterministic lead scoring algorithm:

**[Show table or point to README]**

Each field has a specific point value:
- Destination: 20 points
- Travel Date: 15 points
- Budget: 15 points
- Email: 10 points
- Phone: 10 points
- And more...

**Qualification Thresholds:**
- 60-100: Qualified (saved to Supabase)
- 40-59: In Progress (continue conversation)
- 0-39: Exploring (gather more info)

This ensures only high-intent leads are persisted, saving storage costs and focusing sales efforts."

---

### **Technical Highlights (8:15 - 9:00)**

**[Screen share: Show code snippets briefly]**

"Let me highlight a few technical implementation details:

**1. Conversation Memory with Deduplication**
**[Show memory.service.js]**
The memory service tracks all messages, detects corrections, and prevents duplicate processing.

**2. Merge Strategy**
**[Show lead.service.js]**
The merge function never overwrites existing values with null — it only updates with new, valid data.

**3. Error Handling**
**[Show gemini.service.js]**
The Gemini service has retry logic with exponential backoff and specific error messages for different failure modes.

**4. Fire-and-Forget DB Saves**
**[Show chat.service.js]**
Database writes are non-blocking — the chat response isn't delayed by Supabase writes."

---

### **Conclusion (9:00 - 9:30)**

**[Camera on]**

"This application demonstrates:
- Full-stack development with React, Node.js, and Supabase
- AI integration with Google Gemini 2.5 Flash
- Real-time data extraction and scoring
- Production-ready error handling and logging
- Clean, maintainable code architecture

The project is live on GitHub at the link below, and you can run it locally by cloning the repo and adding your Gemini API key to the `.env` file.

Thanks for watching!"

**[Camera off]**

**[Show GitHub repo URL on screen for 5 seconds]**
**https://github.com/karranverrma/AI-Travel-Lead-Assistant**

---

## 🎥 Recording Tips

1. **Speed:** Keep a steady pace, but pause briefly after each AI response
2. **Emphasis:** Highlight the lead panel updates when scores change
3. **Clarity:** Zoom in on code snippets when showing implementation details
4. **Engagement:** Use the cursor to point to specific UI elements
5. **Backup:** Have a second browser window ready with the app already loaded
6. **Audio:** Speak clearly and at a moderate pace
7. **Length:** Aim for 8-10 minutes — not too short, not too long

## 📊 Key Metrics to Mention

- **Response Time:** ~2-3 seconds per AI message
- **Lead Score Range:** 0-100 points
- **Qualification Threshold:** 60 points
- **Supported Fields:** 11 lead data fields
- **Edge Cases Handled:** 8+ scenarios
- **Tech Stack:** 3 main technologies (React, Node.js, Supabase)

## 🐛 Troubleshooting

If something goes wrong during recording:
- **AI response slow:** Wait for it, don't skip
- **Score not updating:** Refresh the page
- **Server crashed:** Restart and continue from last step
- **Typo in chat:** Use it as a natural conversation moment

## ✅ Post-Recording Checklist

- [ ] Review audio quality
- [ ] Check screen visibility (text readable?)
- [ ] Trim long pauses
- [ ] Add chapter markers if needed
- [ ] Verify GitHub link is visible at the end
- [ ] Export in 1080p if possible