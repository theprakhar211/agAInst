"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Side, PvPSession } from "@/lib/types"
import { saveDebate, savePvPSession } from "@/lib/cloudStorage"
import Image from "next/image"
import { getTrendingTopics } from "@/lib/api"
import { UserMenu } from "@/components/UserMenu"

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
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200 font-sans">

      {/* ─── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-[#080808]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo3.png"
              alt="agAInst logo"
              width={56}
              height={56}
              priority
              className="rounded-md"
            />
            <span className="text-xl font-black tracking-tighter uppercase">
              ag<span className="text-red-600">AIN</span>st
            </span>
          </div>

          {/* Nav right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/history")}
              className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 transition-all"
            >
              📚 Past debates
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 transition-all"
            >
              🏆 Leaderboard
            </button>
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Red glow focal point */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Live badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-400">
              AI-Powered Debate Arena
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.88] uppercase tracking-tighter mb-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Human Wit vs.{" "}
            <span
              className="text-red-600"
              style={{ textShadow: "0 0 60px rgba(220,38,38,0.4)" }}
            >
              Artificial
              <br />
              Intelligence.
            </span>
            <br />
            <span className="text-zinc-500 text-4xl sm:text-5xl md:text-6xl font-bold italic normal-case tracking-tight">
              Welcome to the Arena.
            </span>
          </motion.h1>

          <motion.p
            className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-12 font-normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Pick any topic, choose your side, and go head-to-head with an AI designed to challenge your perspective.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a
              href="#arena"
              className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-sm transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] active:scale-95"
            >
              Enter Arena →
            </a>
            <button
              onClick={() => router.push("/online-pvp")}
              className="px-8 py-3.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold uppercase tracking-wider text-sm transition-all flex items-center gap-2 active:scale-95"
            >
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Online PvP
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-24 border-y border-zinc-900 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14 text-center">
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-[0.3em] block mb-2">
              Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-px bg-zinc-800" />

            {[
              {
                num: "01",
                title: "Pick a Topic",
                desc: "Browse curated debates or pull live trending topics from the web. Or type anything — the AI will argue the opposite.",
              },
              {
                num: "02",
                title: "Choose Your Side",
                desc: "Argue for, argue against, or let fate decide. Once locked in, there's no backing out.",
              },
              {
                num: "03",
                title: "Argue and Get Judged",
                desc: "Three rounds. Every argument scored on logic, evidence, and rhetorical strength by an impartial AI judge.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                className="relative flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                {/* Step number circle */}
                <div className="w-16 h-16 border border-zinc-800 flex items-center justify-center mb-6 relative bg-[#080808]">
                  <span className="text-2xl font-black text-red-600">{step.num}</span>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-3 text-white">{step.title}</h3>
                <p className="text-zinc-500 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ARENA (main debate setup) ───────────────────────── */}
      <section id="arena" className="py-20">
        <div className="max-w-3xl mx-auto px-6">

          {/* Section label */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-zinc-900" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-600">Central Command</span>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>

          {/* Input card */}
          <motion.div
            className="bg-zinc-900/50 border border-zinc-800 p-6 mb-6 backdrop-blur-sm relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-600/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-600/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-600/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-600/40" />

            <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 block mb-3">
              Topic Input
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && startDebate()}
              placeholder="Enter any topic to debate..."
              className="w-full bg-transparent text-white text-lg placeholder-zinc-700 focus:outline-none mb-6 border-b border-zinc-800 pb-4 focus:border-red-500/40 transition-all duration-200 font-mono"
            />

            {/* Side selector */}
            <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 block mb-3">
              Your Position
            </label>
            <div className="flex gap-2 mb-6">
              {([
                { value: "for", label: "I argue for" },
                { value: "against", label: "I argue against" },
                { value: "random", label: "Surprise me" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSide(opt.value)}
                  className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-wider transition-all border ${
                    side === opt.value
                      ? "bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                      : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {opt.value === "random" ? `🎲 ${opt.label}` : opt.label}
                </button>
              ))}
            </div>

            {/* Battle mode grid */}
            <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 block mb-3">
              Select Mode
            </label>
            <div className="grid grid-cols-2 gap-3 relative mb-3">
              <button
                onClick={startDebate}
                disabled={!topic.trim()}
                className="py-4 bg-red-600 hover:bg-red-700 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.35)] active:scale-[0.99] z-10"
              >
                vs AI →
              </button>

              {/* VS divider badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className={`text-[10px] tracking-widest font-black uppercase px-2 py-1 bg-[#080808] border border-zinc-800 transition-colors duration-300 ${topic.trim() ? "text-red-500/70 border-red-500/20" : "text-zinc-600"}`}>
                  vs
                </span>
              </div>

              <button
                onClick={startPvP}
                disabled={!topic.trim()}
                className="py-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-widest transition-all border border-zinc-800 hover:border-zinc-600 active:scale-[0.99] z-10"
              >
                2 Players →
              </button>
            </div>

            {/* Online PvP */}
            <button
              onClick={() => router.push("/online-pvp")}
              className="w-full py-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-green-500/30 text-zinc-500 hover:text-white transition-all text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Online PvP — debate a real person
            </button>
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
                className={`text-[11px] font-mono uppercase tracking-widest px-4 py-1.5 transition-all border ${
                  !showTrending
                    ? "text-white bg-zinc-900 border-zinc-700"
                    : "text-zinc-600 border-transparent hover:text-zinc-400"
                }`}
              >
                Curated
              </button>
              <button
                onClick={fetchTrending}
                className={`text-[11px] font-mono uppercase tracking-widest px-4 py-1.5 transition-all flex items-center gap-2 border ${
                  showTrending
                    ? "text-white bg-zinc-900 border-zinc-700"
                    : "text-zinc-600 border-transparent hover:text-zinc-400"
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
                    className={`flex items-center justify-between px-5 py-3.5 border ease-out duration-200 transition-all text-left group ${
                      hoveredTopic === t.text || topic === t.text
                        ? "bg-zinc-900 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                        : "bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono transition-colors duration-200 ${CATEGORY_STYLES[t.category]}`}>
                        {t.category}
                      </span>
                      <span className="text-zinc-300 text-sm group-hover:text-white transition-colors duration-200">{t.text}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 border font-mono flex-shrink-0 ml-3 transition-all duration-200 ${DIFFICULTY_STYLES[t.difficulty]}`}>
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
                  <div className="text-center py-12 text-zinc-600 text-xs font-mono uppercase tracking-widest">
                    Fetching what the world is arguing about...
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
                    className={`flex items-center justify-between px-5 py-3.5 border ease-out duration-200 transition-all text-left group ${
                      hoveredTopic === t.text || topic === t.text
                        ? "bg-zinc-900 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                        : "bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono transition-colors duration-200 ${CATEGORY_STYLES[t.category] ?? "text-zinc-400"}`}>
                          {t.category}
                        </span>
                        <span className="text-zinc-300 text-sm group-hover:text-white transition-colors duration-200">{t.text}</span>
                      </div>
                      {t.why_trending && (
                        <span className="text-xs text-zinc-600 group-hover:text-zinc-500 transition-colors duration-200">{t.why_trending}</span>
                      )}
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 border font-mono flex-shrink-0 ml-3 transition-all duration-200 ${DIFFICULTY_STYLES[t.difficulty] ?? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"}`}>
                      {t.difficulty}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="py-12 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Branding */}
          <div className="flex items-center gap-2">
            <Image src="/logo3.png" alt="agAInst" width={24} height={24} className="rounded opacity-40 grayscale" />
            <span className="text-sm font-black tracking-tighter uppercase text-zinc-700">ag<span className="text-zinc-600">AIN</span>st</span>
          </div>

          {/* Tagline */}
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest text-center">
            Most AI agrees with you. This one won't.
          </p>

          {/* Attribution */}
          <p className="text-[11px] font-mono text-zinc-700 uppercase tracking-widest text-center">
            Built by{" "}
            <span className="text-zinc-500 font-bold">Prakhar Sharma</span>
            {" · "}
            <a
              href="https://github.com/theprakhar211"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-600 transition-colors"
            >
              GitHub
            </a>
            {" · "}
            <a
              href="https://prakhar-sharma.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-600 transition-colors"
            >
              Portfolio
            </a>
          </p>
        </div>
      </footer>

      {/* ─── PvP SETUP MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showPvPSetup && (
          <motion.div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowPvPSetup(false)}
          >
            <motion.div
              className="bg-zinc-950 border border-zinc-800 p-8 w-full max-w-sm space-y-6 relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-600/40" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-600/40" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-600/40" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-600/40" />

              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-600 block mb-1">
                  2 Player Setup
                </span>
                <p className="text-zinc-400 text-sm truncate">{topic}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-1.5 block">
                    Player 1 · FOR
                  </label>
                  <input
                    value={p1Name}
                    onChange={e => setP1Name(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmPvP()}
                    placeholder="Enter name..."
                    className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-red-500/50 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1.5 block">
                    Player 2 · AGAINST
                  </label>
                  <input
                    value={p2Name}
                    onChange={e => setP2Name(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmPvP()}
                    placeholder="Enter name..."
                    className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPvPSetup(false)}
                  className="flex-1 py-3 border border-zinc-800 text-zinc-500 text-sm font-mono uppercase tracking-widest transition-colors hover:border-zinc-600 hover:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPvP}
                  disabled={!p1Name.trim() || !p2Name.trim()}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-sm transition-all"
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