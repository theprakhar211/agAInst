// frontend/app/page.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Side } from "@/lib/types"
import { saveDebate } from "@/lib/storage"

const SAMPLE_TOPICS = [
  { text: "AI will replace programmers", difficulty: "Intermediate" },
  { text: "Remote work is better than office work", difficulty: "Beginner" },
  { text: "Social media does more harm than good", difficulty: "Beginner" },
  { text: "Crypto will replace traditional banking", difficulty: "Hard" },
  { text: "Nuclear energy is the future of power", difficulty: "Intermediate" },
  { text: "College degrees are no longer worth it", difficulty: "Intermediate" },
]

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Hard: "bg-red-100 text-red-800",
}

export default function Home() {
  const router = useRouter()
  const [topic, setTopic] = useState("")
  const [side, setSide] = useState<Side | "random">("random")

  function startDebate() {
  if (!topic.trim()) return
  const resolvedSide: Side =
    side === "random" ? (Math.random() < 0.5 ? "for" : "against") : side

  const session = {
    id: crypto.randomUUID(),
    topic: topic.trim(),
    userSide: resolvedSide,
    rounds: [],
    status: "debating" as const,
    createdAt: Date.now(),
    aiGoesFirst: Math.random() < 0.5,   // 50/50 who opens
  }
  saveDebate(session)
  router.push(`/debate/${session.id}`)
}

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">
            ag<span className="text-red-500">AI</span>nst
          </h1>
          <p className="text-zinc-400 text-lg">
            Most AI agrees with you. This one won't.
          </p>
        </div>

        <div className="flex justify-center mt-2">
        <button
            onClick={() => router.push("/history")}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
            View past debates →
        </button>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startDebate()}
            placeholder="Enter any topic to debate..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-white placeholder-zinc-500 text-lg focus:outline-none focus:border-red-500 transition-colors"
          />

          {/* Side selector */}
          <div className="flex gap-3">
            {(["for", "against", "random"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                  side === s
                    ? "bg-red-500 border-red-500 text-white"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {s === "random" ? "🎲 Random" : `I argue ${s}`}
              </button>
            ))}
          </div>

          <button
            onClick={startDebate}
            disabled={!topic.trim()}
            className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-xl transition-colors"
          >
            Start Debate
          </button>
        </div>

        {/* Topic suggestions */}
        <div className="space-y-3">
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
            Try one of these
          </p>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_TOPICS.map(t => (
              <button
                key={t.text}
                onClick={() => setTopic(t.text)}
                className="flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-4 py-3 text-left transition-colors group"
              >
                <span className="text-zinc-300 text-sm group-hover:text-white transition-colors">
                  {t.text}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_STYLES[t.difficulty]}`}>
                  {t.difficulty}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}