<div align="center">

# ⚔️ ag**AI**nst

### *Most AI agrees with you. This one won't.*

**agAInst** is an AI-powered debate arena where you go head-to-head against an AI that genuinely pushes back — no validation, no agreement, just sharp arguments and a judge that doesn't care about your feelings.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

<br/>

🌐 **[Live Demo](https://against-chi.vercel.app)** · 🐛 **[Report Bug](https://github.com/theprakhar211/agAInst/issues)** · ✨ **[Request Feature](https://github.com/theprakhar211/agAInst/issues)**

</div>

---

## 🎯 What is agAInst?

You enter any topic. You pick a side. The AI takes the **opposite position** and argues it with genuine conviction — no strawmen, no backing down, no agreeing with you just to be polite.

After **3 structured rounds**, a completely separate AI judge evaluates the entire debate and delivers a verdict — scored on logic, evidence, rebuttal quality, and clarity.

```
💬 You type your argument
        ↓
🤖 AI fires back with a real counter-argument  
        ↓
🔁 Repeat for 3 rounds (Opening → Rebuttal → Closing)
        ↓
⚖️  Independent AI judge evaluates everything
        ↓
🏆 Winner declared · Scores · Fallacies detected · Shareable verdict link
```

---

## ✨ Features

### 🥊 Core Debate
| Feature | Description |
|---------|-------------|
| 🌍 **Any topic** | Type literally anything — "AI will replace programmers", "pineapple belongs on pizza", anything |
| 🎲 **Side selection** | Argue FOR, AGAINST, or let the app assign randomly |
| 🔄 **3-round structure** | Opening → Rebuttal → Closing |
| 🎤 **Random first mover** | AI sometimes opens — keeps it unpredictable |
| ✍️ **400 char limit** | Forces concise, structured thinking |
| 🔥 **Trending topics** | Live web-sourced debate topics pulled via Groq |

### ⚖️ AI Judge
- 🧠 **Completely independent** — separate Groq call, never sees the debater's instructions
- 📊 **4-axis scoring** — Logic, Evidence, Rebuttal Quality, Clarity (each /10)
- 🏆 **Winner declaration** with specific reasoning
- 💬 **Strongest argument** highlight from the entire debate
- ⚠️ **Logical fallacy detection** — ad hominem, strawman, false dichotomy, and more
- 🤝 **Draw handling** — gracefully handles edge cases where no winner can be determined

### 🔬 Argument Analyser
- ⚡ **Real-time feedback** — fires in parallel, doesn't slow you down
- 📈 **Claim strength + evidence quality** scores per argument
- 🎭 **Emotional vs logical** tone detection
- 🚩 **Filler phrase detection** — catches "I think maybe", "sort of", "probably"
- 🎯 **Predicts AI's next move** — tells you what the AI will target in rebuttal

### 👥 2 Player Mode
- 🤝 Two humans debate on the **same machine**
- 🔒 **Screen blurs between turns** — pass the device, no peeking
- 📊 AI analyses **both** players' arguments independently
- ⚖️ Same judge system, same fairness

### 🌐 Online PvP
- ⚡ **Real-time multiplayer** via Supabase Realtime (postgres_changes subscription)
- 🔗 **Share link** — invite opponent with one click, no account required
- 🏠 **Room system** — 6-digit codes, auto-cleanup of stale rooms via pg_cron
- 🤫 **Simultaneous submission** — both players submit independently per round, no turn-order advantage
- ⚖️ Judge fires from Player 1's browser, verdict written to DB, Realtime pushes to Player 2

### 👤 User Accounts & Cloud
- 🔐 **Supabase Auth** — email/password + OAuth
- ☁️ **Cloud sync** — debates saved to Supabase, accessible across devices
- 🔄 **Guest migration** — localStorage debates migrate to cloud on first login
- 🏆 **Global leaderboard** — top 100 by win rate, total wins, or avg score
- 📊 **Profile page** — full stats, win rate ring, skill breakdown, match log
- 🔗 **Shareable verdict links** — send any completed debate verdict to anyone, no login required

### 🎨 Polish
- ✨ Framer Motion animations on every interaction
- 📸 **Downloadable result card** (PNG)
- 📄 **PDF export** of full debate transcript
- 🔄 **Side Flip mode** — replay arguing the other position
- 📚 **Debate history** — VS AI, Local PvP, and Online PvP in one view
- 🏷️ Topic suggestions with **difficulty ratings** and categories
- 🛡️ **Prompt injection protection** — sanitizes arguments before they reach the LLM
- 🚦 **Rate limiting** — per-IP limits on all LLM endpoints via slowapi

---

## 🧠 Multi-Agent Architecture

Three distinct AI agents, each with a separate system prompt and role in the pipeline:

```
┌─────────────────────────────────────────────────────────┐
│                    User submits argument                 │
└──────────────────────────┬──────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     🤖 DEBATER AGENT           🔬 ANALYSER AGENT
     Argues opposite side       Scores your argument
     Temperature: 0.8           Temperature: 0.3
     (fires in parallel, non-blocking)
              │
              ▼
     After Round 3 only:
     ⚖️  JUDGE AGENT
     Evaluates full transcript
     Returns structured JSON
     Temperature: 0.2
     Retry logic on parse failure
```

> **Key design decision:** Fully **stateless API** — every request sends the complete conversation history. No server-side session state, no bugs on refresh, scales horizontally with zero changes.

---

## 🛠️ Tech Stack

```
🎨 Frontend                  ⚙️  Backend                🤖 AI
──────────────               ─────────────              ─────────────
Next.js 15                   FastAPI                    Groq API
Tailwind CSS                 Python 3.11                Llama 3.3 70B
Framer Motion                Pydantic                   3 system prompts
html2canvas                  Uvicorn                    Structured JSON output
jsPDF                        slowapi (rate limiting)    Retry on parse failure

💾 Database & Auth           🚀 Deployment
──────────────               ─────────────
Supabase (Postgres)          Vercel  → Frontend
Supabase Auth                Render  → Backend API
Supabase Realtime            UptimeRobot → Keep-alive pings
Supabase Storage             pg_cron → Stale room cleanup
```

---

## 📁 Project Structure

```
agAInst/
│
├── 🎨 frontend/
│   ├── app/
│   │   ├── 🏠 page.tsx                          # Landing page
│   │   ├── ⚔️  debate/[id]/page.tsx              # VS AI arena
│   │   ├── ⚖️  verdict/[id]/page.tsx             # VS AI verdict (shareable)
│   │   ├── 👥 pvp/[id]/page.tsx                  # Local 2P arena
│   │   ├── 🏆 pvp/verdict/[id]/page.tsx          # Local 2P verdict
│   │   ├── 🌐 online-pvp/page.tsx                # Online PvP lobby
│   │   ├── 🌐 online-pvp/room/[code]/page.tsx    # Online PvP arena
│   │   ├── 🌐 online-pvp/verdict/[code]/page.tsx # Online PvP verdict
│   │   ├── 📚 history/page.tsx                   # All debates (3 tabs)
│   │   ├── 🏆 leaderboard/page.tsx               # Top 100, 3 sort modes
│   │   ├── 👤 profile/page.tsx                   # Stats + avatar + username
│   │   ├── 🔐 auth/callback/route.ts             # OAuth callback
│   │   ├── 404 not-found.tsx
│   │   └── 💥 error.tsx                          # Error boundary
│   ├── components/
│   │   ├── 🔬 AnalysisPanel.tsx                  # Per-argument breakdown
│   │   ├── 🔐 AuthModal.tsx                      # Sign in/up modal
│   │   ├── 👤 UserMenu.tsx                       # Avatar dropdown
│   │   └── 🔄 MigrationRunner.tsx                # localStorage→cloud on login
│   ├── context/
│   │   └── AuthContext.tsx                       # Global auth state
│   └── lib/
│       ├── 🔌 api.ts                             # FastAPI client + timeouts
│       ├── 📝 types.ts                           # TypeScript interfaces
│       ├── 💾 storage.ts                         # localStorage helpers
│       ├── ☁️  cloudStorage.ts                   # Cloud sync wrapper
│       ├── 🔐 supabase.ts                        # Supabase singleton
│       ├── 🌐 onlinePvp.ts                       # Room ops + Realtime
│       ├── 🏆 leaderboard.ts                     # Leaderboard fetch
│       └── 🏷️  topics.ts                         # Curated topic list
│
└── ⚙️  backend/
    ├── 🚀 main.py                                # FastAPI app + CORS + rate limiting
    ├── routers/
    │   └── 🛣️  debate.py                         # /argue /judge /analyse /pvp/judge /trending
    ├── services/
    │   └── 🤖 groq_client.py                     # Groq SDK wrapper
    └── models/
        └── 📐 schemas.py                         # Pydantic schemas
```

---

## 🗄️ Database Schema

```
Supabase Tables
───────────────────────────────────────────────────────────
debates           VS AI sessions — topic, rounds, verdict
pvp_sessions      Local 2P sessions — same structure
online_pvp_rooms  Online PvP with Realtime + last_active_at
profiles          username, avatar_url — auto-created on signup
leaderboard       Materialized view, refreshed daily

Automation
───────────────────────────────────────────────────────────
pg_cron           Marks stale online rooms as 'abandoned'
                  every 10 minutes (30 min inactivity threshold)
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- A [Groq API key](https://console.groq.com) (free tier available)
- A [Supabase](https://supabase.com) project (free tier available)

### ⚙️ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GROQ_API_KEY=your_key_here
```

```bash
# Start the server
uvicorn main:app --reload --port 8000
```

✅ Backend running at `http://localhost:8000`  
✅ API docs at `http://localhost:8000/docs`

### 🎨 Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

✅ App running at `http://localhost:3000`

---

## 🌐 Deployment

| | Platform | Configuration |
|--|----------|---------------|
| 🎨 **Frontend** | Vercel | Root dir: `frontend` |
| ⚙️ **Backend** | Render | Root dir: `backend` · Start: `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| 🔔 **Uptime** | UptimeRobot | Ping `https://your-api.onrender.com/health` every 5 min |

**Environment variables:**
- Render → `GROQ_API_KEY`
- Vercel → `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 💼 Why This Is Interesting (For Interviews)

> *"Pick any topic — any topic at all."*

That's the demo opener. Nobody forgets it.

But beyond the demo moment, here's what this project actually demonstrates:

| Concept | Implementation |
|---------|----------------|
| 🧠 **Multi-agent AI** | Three LLMs with distinct roles — debater, judge, analyser — in one pipeline |
| ⚡ **Parallel async** | Analyser fires alongside debater via `Promise.all` — no added latency |
| 📊 **Structured LLM output** | Judge returns typed JSON with validation + retry logic on parse failure |
| 🔄 **Stateless API design** | Full context passed per request — no server-side state |
| ⚡ **Real-time sync** | Online PvP via Supabase Realtime postgres_changes subscription |
| ☁️ **Cloud + offline hybrid** | Guest localStorage → cloud sync on login with full migration |
| 🛡️ **Production hardening** | Rate limiting (slowapi), prompt injection sanitization, request timeouts |
| 🗄️ **Database automation** | pg_cron cleans stale rooms every 10 min, no manual intervention |
| 🚀 **Full-stack deployment** | Separate frontend/backend on different platforms, wired via env vars |
| 🎨 **Production UI** | Framer Motion, real-time feedback, shareable verdicts, PDF export |

---

## 🗺️ Roadmap

- [x] 🥊 Core 3-round debate loop
- [x] ⚖️ AI judge with structured JSON scoring
- [x] 🔬 Real-time argument analyser
- [x] 🔄 Side Flip mode
- [x] 👥 Local 2 Player mode
- [x] 📸 Shareable result card + PDF export
- [x] 📚 Debate history (VS AI + Local PvP + Online)
- [x] 🔥 Trending topics via Groq web search
- [x] 👤 User accounts + cloud sync + guest migration
- [x] 🏆 Global leaderboard (win rate / total wins / avg score)
- [x] 🌐 Online PvP with Realtime sync + room codes + share links
- [x] 🔗 Shareable verdict links (public, no login required)
- [x] 🛡️ Rate limiting on all LLM endpoints
- [x] 🗄️ Automated stale room cleanup via pg_cron
- [x] ⏱️ Request timeouts + retry UI on judge failures
- [ ] 🎙️ Voice input support
- [ ] 📈 ELO rating system

---

## 📄 License

MIT — use it, fork it, build on it.

---

<div align="center">

**Built by [Prakhar Sharma](https://github.com/theprakhar211)** · [Portfolio](https://prakhar-sharma.vercel.app)

⚔️ *Challenge your thinking. Sharpen your arguments. Win the debate.*

<sub>Made with Next.js · FastAPI · Groq · Supabase · Llama 3.3 70B</sub>

</div>
