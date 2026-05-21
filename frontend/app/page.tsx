"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Side, PvPSession } from "@/lib/types"
import { saveDebate, savePvPSession } from "@/lib/storage"

const TOPICS = [
  { text: "AI will replace programmers", difficulty: "Intermediate", category: "Tech" },
  { text: "Remote work is better than office work", difficulty: "Beginner", category: "Career" },
  { text: "Social media does more harm than good", difficulty: "Beginner", category: "Society" },
  { text: "Crypto will replace traditional banking", difficulty: "Hard", category: "Finance" },
  { text: "Nuclear energy is the future of power", difficulty: "Intermediate", category: "Science" },
  { text: "College degrees are no longer worth it", difficulty: "Intermediate", category: "Education" },
  { text: "Surveillance capitalism should be illegal", difficulty: "Hard", category: "Ethics" },
  { text: "Space exploration is a waste of money", difficulty: "Beginner", category: "Science" },
  { text: "Humans are fundamentally good", difficulty: "Hard", category: "Philosophy" },
]

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Hard: "text-red-400 bg-red-400/10 border-red-400/20",
}

const CATEGORY_STYLES: Record<string, string> = {
  Tech: "text-blue-400",
  Career: "text-purple-400",
  Society: "text-pink-400",
  Finance: "text-yellow-400",
  Science: "text-cyan-400",
  Education: "text-green-400",
  Ethics: "text-orange-400",
  Philosophy: "text-violet-400",
}

export default function Home() {
  const router = useRouter()
  const [topic, setTopic] = useState("")
  const [side, setSide] = useState<Side | "random">("random")
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const [showPvPSetup, setShowPvPSetup] = useState(false)
  const [p1Name, setP1Name] = useState("")
  const [p2Name, setP2Name] = useState("")

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
      aiGoesFirst: Math.random() < 0.5,
    }
    saveDebate(session)
    router.push(`/debate/${session.id}`)
  }

  function startPvP() {
    if (!topic.trim()) return
    setShowPvPSetup(true)
  }

  function confirmPvP() {
    if (!p1Name.trim() || !p2Name.trim()) return
    const resolvedSide: Side =
      side === "random" ? (Math.random() < 0.5 ? "for" : "against") : side

    const session: PvPSession = {
      id: crypto.randomUUID(),
      topic: topic.trim(),
      player1Side: resolvedSide,
      player2Side: resolvedSide === "for" ? "against" : "for",
      player1Name: p1Name.trim(),
      player2Name: p2Name.trim(),
      rounds: [],
      status: "debating",
      createdAt: Date.now(),
    }
    savePvPSession(session)
    router.push(`/pvp/${session.id}`)
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <span className="text-lg font-bold tracking-tight">
          ag<span className="text-red-500">AI</span>nst
        </span>
        <button
          onClick={() => router.push("/history")}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
        >
          Past debates
          <span className="text-zinc-700">→</span>
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-20 pb-32">

        {/* Hero */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-medium tracking-wide">AI-powered debate arena</span>
          </div>

          <h1 className="text-6xl font-bold tracking-tight mb-6 leading-none">
            Most AI agrees
            <br />
            <span className="text-red-500">with you.</span>
          </h1>
          <p className="text-zinc-400 text-xl leading-relaxed max-w-lg mx-auto">
            This one won&apos;t. Pick any topic, choose your side, and go head-to-head with an AI that genuinely pushes back.
          </p>
        </motion.div>

        {/* Input card */}
        <motion.div
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startDebate()}
            placeholder="Enter any topic to debate..."
            className="w-full bg-transparent text-white text-lg placeholder-zinc-600 focus:outline-none mb-6 border-b border-zinc-800 pb-4 focus:border-zinc-600 transition-colors"
          />

          {/* Side selector */}
          <div className="flex gap-2 mb-6">
            {([
              { value: "for", label: "I argue for" },
              { value: "against", label: "I argue against" },
              { value: "random", label: "🎲 Surprise me" },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setSide(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  side === opt.value
                    ? "bg-red-500 border-red-500 text-white"
                    : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={startDebate}
              disabled={!topic.trim()}
              className="py-4 bg-red-500 hover:bg-red-600 disabled:opacity-20 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              vs AI →
            </button>
            <button
              onClick={startPvP}
              disabled={!topic.trim()}
              className="py-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all border border-zinc-700 hover:border-zinc-500 hover:scale-[1.01] active:scale-[0.99]"
            >
              2 Players →
            </button>
          </div>
        </motion.div>

        {/* Topic suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-4 text-center">
            Or pick a topic
          </p>
          <div className="grid grid-cols-1 gap-2">
            {TOPICS.map((t, i) => (
              <motion.button
                key={t.text}
                onClick={() => setTopic(t.text)}
                onHoverStart={() => setHoveredTopic(t.text)}
                onHoverEnd={() => setHoveredTopic(null)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className={`flex items-center justify-between px-5 py-3.5 rounded-xl border transition-all text-left ${
                  hoveredTopic === t.text || topic === t.text
                    ? "bg-zinc-800 border-zinc-600"
                    : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${CATEGORY_STYLES[t.category]}`}>
                    {t.category}
                  </span>
                  <span className="text-zinc-300 text-sm">{t.text}</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${DIFFICULTY_STYLES[t.difficulty]}`}>
                  {t.difficulty}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>

      {/* PvP Setup Modal */}
      <AnimatePresence>
        {showPvPSetup && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowPvPSetup(false)}
          >
            <motion.div
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-full max-w-sm space-y-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div>
                <h2 className="text-white font-bold text-lg mb-1">2 Player Setup</h2>
                <p className="text-zinc-500 text-sm truncate">{topic}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-red-400 uppercase tracking-widest mb-1.5 block">
                    Player 1 · FOR
                  </label>
                  <input
                    value={p1Name}
                    onChange={e => setP1Name(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmPvP()}
                    placeholder="Enter name..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-blue-400 uppercase tracking-widest mb-1.5 block">
                    Player 2 · AGAINST
                  </label>
                  <input
                    value={p2Name}
                    onChange={e => setP2Name(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmPvP()}
                    placeholder="Enter name..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPvPSetup(false)}
                  className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-xl text-sm transition-colors hover:border-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPvP}
                  disabled={!p1Name.trim() || !p2Name.trim()}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Start →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  )
}