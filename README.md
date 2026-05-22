<div align="center">

# ⚔️ ag**AI**nst

### *Most AI agrees with you. This one won't.*

**agAInst** is an AI-powered debate arena where you go head-to-head against an AI that genuinely pushes back — no validation, no agreement, just sharp arguments and a judge that doesn't care about your feelings.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com)
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
🔁 Repeat for 3 rounds
        ↓
⚖️  Independent AI judge evaluates everything
        ↓
🏆 Winner declared · Scores · Fallacies detected
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

### ⚖️ AI Judge
- 🧠 **Completely independent** — separate Groq call, never sees the debater's instructions
- 📊 **4-axis scoring** — Logic, Evidence, Rebuttal Quality, Clarity (each /10)
- 🏆 **Winner declaration** with specific reasoning
- 💬 **Strongest argument** highlight from the entire debate
- ⚠️ **Logical fallacy detection** — ad hominem, strawman, false dichotomy, and more

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

### 🎨 Polish
- ✨ Framer Motion animations on every interaction
- 📸 **Downloadable result card** (PNG)
- 📄 **PDF export** of full debate transcript
- 🔄 **Side Flip mode** — replay arguing the other position
- 📚 **Debate history** saved locally
- 🏷️ Topic suggestions with **difficulty ratings**

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
html2canvas                  Uvicorn
jsPDF

💾 Storage                   🚀 Deployment
──────────────               ─────────────
localStorage (v1)            Vercel  → Frontend
                             Render  → Backend API
```

---

## 📁 Project Structure

```
agAInst/
│
├── 🎨 frontend/
│   ├── app/
│   │   ├── 🏠 page.tsx                 # Landing page
│   │   ├── ⚔️  debate/[id]/page.tsx    # Debate arena
│   │   ├── ⚖️  verdict/[id]/page.tsx   # Judge panel
│   │   ├── 👥 pvp/[id]/page.tsx        # 2 Player arena
│   │   ├── 🏆 pvp/verdict/[id]/        # 2 Player verdict
│   │   └── 📚 history/page.tsx         # Past debates
│   ├── components/
│   │   └── 🔬 AnalysisPanel.tsx        # Per-argument breakdown
│   └── lib/
│       ├── 🔌 api.ts                   # FastAPI client
│       ├── 📝 types.ts                 # TypeScript interfaces
│       ├── 💾 storage.ts               # localStorage helpers
│       └── 🏷️  topics.ts               # Curated topic list
│
└── ⚙️  backend/
    ├── 🚀 main.py                      # FastAPI app + CORS
    ├── routers/
    │   └── 🛣️  debate.py               # /argue /judge /analyse /pvp/judge
    ├── services/
    │   ├── 🤖 groq_client.py           # Groq SDK wrapper
    │   └── 📋 prompts.py               # System prompts
    └── models/
        └── 📐 schemas.py               # Pydantic schemas
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- A [Groq API key](https://console.groq.com) (free tier available)

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

**Environment variables:**
- Render → `GROQ_API_KEY`
- Vercel → `NEXT_PUBLIC_API_URL` (your Render URL)

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
| 🚀 **Full-stack deployment** | Separate frontend/backend on different platforms, wired via env vars |
| 🎨 **Production UI** | Framer Motion, real-time feedback, shareable cards, PDF export |

---

## 🗺️ Roadmap

- [x] 🥊 Core 3-round debate loop
- [x] ⚖️ AI judge with structured JSON scoring
- [x] 🔬 Real-time argument analyser
- [x] 🔄 Side Flip mode
- [x] 👥 2 Player mode
- [x] 📸 Shareable result card + PDF export
- [x] 📚 Local debate history
- [x] 🔥 Trending topics via web search
- [ ] 👤 User accounts + cloud history
- [ ] 🏆 Global leaderboard
- [ ] 🎙️ Voice input support
- [ ] 📱 Mobile app

---

## 📄 License

MIT — use it, fork it, build on it.

---

<div align="center">

**Built by [Prakhar](https://github.com/theprakhar211)**

⚔️ *Challenge your thinking. Sharpen your arguments. Win the debate.*

<sub>Made with Next.js · FastAPI · Groq · Llama 3.3 70B</sub>

</div>
