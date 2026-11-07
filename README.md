<div align="center">

# ⚔️ ag**AI**nst

### *Most AI agrees with you. This one won't.*

**agAInst** is an AI debate arena where you argue any topic against an AI that takes the opposite side, then an independent AI judge scores the debate on logic, evidence, rebuttal and clarity.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-gpt--oss--120b-F55036?style=for-the-badge)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

<br/>

🌐 **[Live Demo](https://against-debate.vercel.app/)** · 🐛 **[Report Bug](https://github.com/theprakhar211/agAInst/issues)** · ✨ **[Request Feature](https://github.com/theprakhar211/agAInst/issues)**

</div>

---

## 🎯 What is agAInst?

You enter any topic and pick a side. The AI takes the **opposite position** and argues it back.

After **3 structured rounds**, a separate AI judge evaluates the whole debate and delivers a verdict, scored on logic, evidence, rebuttal quality and clarity.

```
💬 You type your argument
        ↓
🤖 The debater replies with a counter-argument
        ↓            (the analyser starts right away, without blocking the debate)
🔁 Repeat for 3 rounds (Opening → Rebuttal → Closing)
        ↓
⚖️  Independent AI judge evaluates everything
        ↓
🏆 Winner · Scores · Fallacies detected · Shareable verdict link
```

---

## ✨ Features

### 🥊 Core Debate
| Feature | Description |
|---------|-------------|
| 🌍 **Any topic** | Type anything — "AI will replace programmers", "pineapple belongs on pizza" |
| 🎲 **Side selection** | Argue FOR, AGAINST, or let the app assign a side randomly |
| 🔄 **3-round structure** | Opening → Rebuttal → Closing |
| 🎤 **Random first mover** | The AI sometimes opens |
| ✍️ **400 character limit** | Keeps arguments concise |
| 🔥 **Topic suggestions** | AI-generated debate topics with category and difficulty, cached for 15 minutes with a static fallback list |

### ⚖️ AI Judge
- 🧠 **Independent** — a separate Groq call with its own prompt; it never sees the debater's instructions
- 📊 **4-axis scoring** — Logic, Evidence, Rebuttal Quality, Clarity (each /10)
- 🏆 **Winner declaration** with reasoning
- 💬 **Strongest argument** highlight
- ⚠️ **Logical fallacy detection**
- 🔁 **Structured JSON output** with validation and retry on parse failure

### 🔬 Argument Analyser
- ⚡ **Non-blocking** — starts right after the debater request and never holds up the debate
- 📈 **Claim strength and evidence quality** scores per argument
- 🎭 **Emotional vs logical** tone detection
- 🚩 **Filler phrase detection**
- 🎯 **Predicts the AI's next move**

### 👥 2 Player Mode
- 🤝 Two humans debate on the **same machine**
- 🔒 **Screen blurs between turns** so you can pass the device
- 📊 Both players' arguments are analysed independently
- ⚖️ Scored by a dedicated PvP judge prompt

### 🌐 Online PvP
- ⚡ **Real-time multiplayer** via Supabase Realtime (`postgres_changes` subscription)
- 🔗 **Share link** — invite an opponent with one click
- 🏠 **Room codes** — stale rooms are marked as abandoned by a `pg_cron` job
- 🤫 **Simultaneous submission** — both players submit independently each round
- ⚖️ The judge runs from Player 1's browser, the verdict is written to the database, and Realtime pushes it to Player 2

### 👤 User Accounts & Cloud
- 🔐 **Supabase Auth** — email/password + OAuth
- ☁️ **Cloud sync** — debates saved to Supabase and available across devices
- 🔄 **Guest migration** — local debates migrate to the cloud on first login
- 🏆 **Global leaderboard** — top 100 by win rate, total wins, or average score
- 📊 **Profile page** — stats, win rate, skill breakdown, match log
- 🔗 **Shareable verdict links** — no login required to view

### 🎨 Polish
- ✨ Framer Motion animations
- 📸 Downloadable result card (PNG)
- 📄 PDF export of the full debate transcript
- 🔄 Side Flip mode — replay arguing the other position
- 📚 Debate history for VS AI, Local PvP and Online PvP in one view

### 🛡️ Hardening
- 🛡️ **Prompt-injection sanitising** of player input before it reaches the LLM
- 🚦 **Rate limiting** with slowapi — requests over the limit get HTTP 429
- ⏱️ **35 s client timeouts** with a retry UI on judge failures

---

## 🧠 AI Architecture

Five prompts, all running `openai/gpt-oss-120b` through Groq:

| Prompt | Endpoint | Role | Temperature |
|---|---|---|---|
| Debater | `POST /debate/argue` | Argues the opposite side | 0.8 |
| Judge | `POST /debate/judge` | Scores the full debate, returns JSON | 0.2 |
| Analyser | `POST /debate/analyse` | Scores each argument | 0.3 |
| PvP judge | `POST /debate/pvp/judge` | Judges two human players | 0.2 |
| Topic generator | `GET /debate/trending` | Suggests debate topics | 0.9 |

```
┌─────────────────────────────────────────────┐
│            User submits argument            │
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────┴─────────────┐
          ▼                          ▼
  🤖 DEBATER  /argue          🔬 ANALYSER  /analyse
  (the reply the user         (started right after the
   waits for)                  debater call, not awaited,
                               so it never blocks)
          │
          ▼
  After round 3 only:
  ⚖️  JUDGE  /judge
  Structured JSON, retry on parse failure
```

> **Design decision:** the API is **stateless**. Every request carries the full conversation history, so there is no server-side session state to lose on refresh.

---

## 🧪 Testing & CI

- **45+ pytest tests** in `backend/tests/` covering the debate endpoints, the PvP judge, input sanitising and the trending-topics fallback
- The LLM is **mocked**, so tests need no API key and make no network calls
- **GitHub Actions** (`.github/workflows/backend-tests.yml`) runs the suite on every push and pull request

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest -q
```

### Reliability under load

I stress-tested the live API and found 500 errors. They came from Groq's token limit, which is shared across requests. The fix, in `routers/debate.py`:

- Topic suggestions are **cached** for 15 minutes
- Only one request at a time calls the model; others wait and reuse the result
- After a failed attempt the model is not called again for 30 seconds
- On failure the API serves the previous topics or a **static fallback list** instead of an error
- On this endpoint, provider error details are logged server-side and not sent to the client

---

## 🛠️ Tech Stack

```
🎨 Frontend                  ⚙️  Backend                🤖 AI
──────────────               ─────────────              ─────────────
Next.js 16 · React 19        FastAPI                    Groq API
Tailwind CSS                 Python 3.11+               gpt-oss-120b
Framer Motion                Pydantic                   5 prompts
html2canvas                  Uvicorn                    Structured JSON output
jsPDF                        slowapi (rate limiting)    Retry on parse failure

💾 Database & Auth           🚀 Deployment & CI
──────────────               ─────────────
Supabase (Postgres)          Vercel  → Frontend
Supabase Auth                Render  → Backend API
Supabase Realtime            UptimeRobot → Keep-alive pings
pg_cron → Stale room cleanup GitHub Actions → Backend tests
```

---

## 📁 Project Structure

```
agAInst/
├── .github/workflows/backend-tests.yml   # CI: pytest on push and PR
│
├── 🎨 frontend/
│   ├── app/
│   │   ├── page.tsx                          # Landing page
│   │   ├── debate/[id]/page.tsx              # VS AI arena
│   │   ├── verdict/[id]/page.tsx             # VS AI verdict (shareable)
│   │   ├── pvp/[id]/page.tsx                 # Local 2P arena
│   │   ├── pvp/verdict/[id]/page.tsx         # Local 2P verdict
│   │   ├── online-pvp/page.tsx               # Online PvP lobby
│   │   ├── online-pvp/room/[code]/page.tsx   # Online PvP arena
│   │   ├── online-pvp/verdict/[code]/page.tsx# Online PvP verdict
│   │   ├── history/page.tsx                  # All debates (3 tabs)
│   │   ├── leaderboard/page.tsx              # Top 100, 3 sort modes
│   │   ├── profile/page.tsx                  # Stats + avatar + username
│   │   ├── auth/callback/route.ts            # OAuth callback
│   │   ├── not-found.tsx
│   │   └── error.tsx                         # Error boundary
│   ├── components/                           # AnalysisPanel, AuthModal, UserMenu, MigrationRunner
│   ├── context/AuthContext.tsx               # Global auth state
│   └── lib/                                  # api, types, storage, cloudStorage, supabase, onlinePvp, leaderboard, topics
│
└── ⚙️  backend/
    ├── main.py                               # FastAPI app, CORS, 429 handler, /health
    ├── routers/debate.py                     # /argue /judge /analyse /pvp/judge /trending
    ├── services/groq_client.py               # Groq SDK wrapper
    ├── models/schemas.py                     # Pydantic schemas
    ├── tests/                                # 45+ pytest tests, mocked LLM
    ├── requirements.txt
    └── requirements-dev.txt
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
- Node.js 20+
- Python 3.11+
- A [Groq API key](https://console.groq.com)
- A [Supabase](https://supabase.com) project

### ⚙️ Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GROQ_API_KEY=your_key_here
```

```bash
uvicorn main:app --reload --port 8000
```

✅ API at `http://localhost:8000` · docs at `http://localhost:8000/docs`

### 🎨 Frontend

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

✅ App at `http://localhost:3000`

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

> **Forking?** Allowed CORS origins are listed in `backend/main.py` (`localhost:3000` and the live Vercel URL). Add your own frontend URL there.

---

## 💼 Engineering Highlights

| Concept | Implementation |
|---------|----------------|
| 🧠 **Multi-prompt LLM pipeline** | Debater, judge, analyser, PvP judge and topic generator, each with its own prompt |
| ⚡ **Non-blocking analysis** | The analyser call starts right after the debater call and is not awaited |
| 📊 **Structured LLM output** | The judge returns typed JSON with validation and retry on parse failure |
| 🔄 **Stateless API design** | Full context passed per request |
| ⚡ **Real-time sync** | Online PvP via Supabase Realtime `postgres_changes` |
| ☁️ **Cloud + offline hybrid** | Guest localStorage → cloud sync on login with migration |
| 🛡️ **Hardening** | Rate limiting (HTTP 429), prompt-injection sanitising, request timeouts |
| 🧪 **Testing** | 45+ pytest tests with a mocked LLM, run in GitHub Actions |
| 🔧 **Fault tolerance** | Caching, single-flight model calls and a fallback list keep topic suggestions up when Groq rate-limits |
| 🗄️ **Database automation** | `pg_cron` cleans stale rooms every 10 minutes |

---

## 🗺️ Roadmap

- [x] 🥊 Core 3-round debate loop
- [x] ⚖️ AI judge with structured JSON scoring
- [x] 🔬 Argument analyser
- [x] 🔄 Side Flip mode
- [x] 👥 Local 2 Player mode
- [x] 📸 Shareable result card + PDF export
- [x] 📚 Debate history (VS AI + Local PvP + Online)
- [x] 🔥 AI-generated topic suggestions with caching and fallback
- [x] 👤 User accounts + cloud sync + guest migration
- [x] 🏆 Global leaderboard (win rate / total wins / avg score)
- [x] 🌐 Online PvP with Realtime sync, room codes and share links
- [x] 🔗 Shareable verdict links (public, no login required)
- [x] 🚦 Rate limiting on LLM endpoints
- [x] 🗄️ Automated stale room cleanup via pg_cron
- [x] ⏱️ Request timeouts + retry UI on judge failures
- [x] 🧪 pytest suite + GitHub Actions CI
- [ ] 🎙️ Voice input support
- [ ] 📈 ELO rating system

---

## 📄 License

MIT — use it, fork it, build on it.

---

<div align="center">

**Built by [Prakhar Sharma](https://github.com/theprakhar211)** · [Portfolio](https://prakhar-sharma.vercel.app)

<sub>Made with Next.js · FastAPI · Groq (gpt-oss-120b) · Supabase</sub>

</div>