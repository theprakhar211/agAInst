"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Side, PvPSession } from "@/lib/types"
import { saveDebate, savePvPSession } from "@/lib/storage"
import Image from "next/image"
import { getTrendingTopics } from "@/lib/api"

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
  const [trendingTopics, setTrendingTopics] = useState<any[]>([])
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [showTrending, setShowTrending] = useState(false)

  async function fetchTrending() {
    if (trendingTopics.length > 0) {
      setShowTrending(true)
      return
    }
    setTrendingLoading(true)
    setShowTrending(true)
    try {
      const data = await getTrendingTopics()
      setTrendingTopics(data.topics || [])
    } catch (e) {
      console.error(e)
    } finally {
      setTrendingLoading(false)
    }
  }

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
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Image
            src="/logo3.png"
            alt="agAInst logo"
            width={102}
            height={102}
            priority
            className="rounded-lg"
          />
        </div>
        <button
          onClick={() => router.push("/history")}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-all"
        >
          📚 Past debates
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-20 pb-32">
        
        {/* Hero Area */}
        <motion.div
          className="w-full mb-12 select-none text-center relative flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Centered Premium Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3.5 py-1.5 mb-8 shadow-sm backdrop-blur-md">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">
              AI-powered debate arena
            </span>
          </div>

          {/* Clean, Centered Typography Structure */}
          <div className="space-y-4 max-w-2xl mx-auto w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-400 tracking-tight leading-none">
              Most AI agrees with you.
            </h1>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-[1.1]">
              <span className="text-white line-through decoration-zinc-500/70 decoration-2 md:decoration-4">
                THIS ONE
              </span>
              <br />
              <span 
                className="text-red-500 inline-block pt-1"
                style={{
                  textShadow: "0 0 25px rgba(239, 68, 68, 0.25)"
                }}
              >
                WON'T.
              </span>
            </h2>
          </div>

          {/* Restored Original Description Copy */}
          <p className="text-zinc-500 text-sm sm:text-base mt-8 max-w-xl mx-auto leading-relaxed font-normal tracking-wide">
            Pick any topic, choose your side, and go head-to-head with an AI designed to challenge your perspective.
          </p>
        </motion.div>

        {/* Input card */}
        <motion.div
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6 backdrop-blur-sm relative"
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
            className="w-full bg-transparent text-white text-lg placeholder-zinc-600 focus:outline-none mb-6 border-b border-zinc-800 pb-4 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10 transition-all duration-200"
          />

          {/* Side selector */}
          <div className="flex gap-2 mb-6">
            {([
              { value: "for", label: "I argue for" },
              { value: "against", label: "I argue against" },
              { value: "random", label: "Surprise me" },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setSide(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  side === opt.value
                    ? "bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                    : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                }`}
              >
                {opt.value === "random" ? `🎲 ${opt.label}` : opt.label}
              </button>
            ))}
          </div>

          {/* Battle Mode Trigger Grid with Dynamic 'VS' Split Accent */}
          <div className="grid grid-cols-2 gap-4 relative">
            <button
              onClick={startDebate}
              disabled={!topic.trim()}
              className="py-4 bg-red-500 hover:bg-red-600 disabled:opacity-20 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] z-10"
            >
              vs AI →
            </button>

            {/* Dynamic VS State Badge Divider */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span className={`text-[10px] tracking-widest font-black uppercase px-2 py-1 rounded bg-[#0b0b0b] border border-zinc-800 text-zinc-500 transition-colors duration-300 ${topic.trim() ? "text-red-500/70 border-red-500/20" : ""}`}>
                vs
              </span>
            </div>

            <button
              onClick={startPvP}
              disabled={!topic.trim()}
              className="py-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all border border-zinc-700 hover:border-zinc-500 hover:scale-[1.01] active:scale-[0.99] z-10"
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
          {/* Tab switcher */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setShowTrending(false)}
              className={`text-xs uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all ${
                !showTrending
                  ? "text-white bg-zinc-800 border border-zinc-700"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              Curated
            </button>
            <button
              onClick={fetchTrending}
              className={`text-xs uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                showTrending
                  ? "text-white bg-zinc-800 border border-zinc-700"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              🔥 Trending
              {trendingLoading && (
                <div className="w-3 h-3 border border-zinc-500 border-t-white rounded-full animate-spin" />
              )}
            </button>
          </div>

          {/* Curated topics */}
          {!showTrending && (
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
                  whileHover={{ scale: 1.005 }}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-xl border ease-out duration-200 transition-all text-left group ${
                    hoveredTopic === t.text || topic === t.text
                      ? "bg-zinc-800/80 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                      : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium transition-colors duration-200 ${CATEGORY_STYLES[t.category]}`}>
                      {t.category}
                    </span>
                    <span className="text-zinc-300 text-sm group-hover:text-white transition-colors duration-200">{t.text}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium transition-all duration-200 ${DIFFICULTY_STYLES[t.difficulty]}`}>
                    {t.difficulty}
                  </span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Trending topics */}
          {showTrending && (
            <div className="grid grid-cols-1 gap-2">
              {trendingLoading && (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  Fetching what people are arguing about...
                </div>
              )}
              {!trendingLoading && trendingTopics.map((t, i) => (
                <motion.button
                  key={t.text}
                  onClick={() => setTopic(t.text)}
                  onHoverStart={() => setHoveredTopic(t.text)}
                  onHoverEnd={() => setHoveredTopic(null)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.005 }}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-xl border ease-out duration-200 transition-all text-left group ${
                    hoveredTopic === t.text || topic === t.text
                      ? "bg-zinc-800/80 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                      : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium transition-colors duration-200 ${CATEGORY_STYLES[t.category] ?? "text-zinc-400"}`}>
                        {t.category}
                      </span>
                      <span className="text-zinc-300 text-sm group-hover:text-white transition-colors duration-200">{t.text}</span>
                    </div>
                    {t.why_trending && (
                      <span className="text-xs text-zinc-600 pl-0 group-hover:text-zinc-500 transition-colors duration-200">{t.why_trending}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 ml-3 transition-all duration-200 ${DIFFICULTY_STYLES[t.difficulty] ?? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"}`}>
                    {t.difficulty}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
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
                    Player 1 &middot; FOR
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
                    Player 2 &middot; AGAINST
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