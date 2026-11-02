"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { getDebate, saveDebate } from "@/lib/cloudStorage"
import { argue, analyse } from "@/lib/api"
import { DebateSession, Message, Round, ArgumentAnalysis } from "@/lib/types"
import AnalysisPanel from "@/components/AnalysisPanel"

const ROUND_NAMES = ["Opening", "Rebuttal", "Closing"]
const ROUND_HINTS = [
  "Establish your core position clearly...",
  "Directly address what they just said...",
  "Land your strongest point and summarise...",
]
const CHAR_LIMIT = 400

export default function DebatePage() {
  const { id } = useParams()
  const router = useRouter()
  const [session, setSession] = useState<DebateSession | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [analyses, setAnalyses] = useState<Record<number, ArgumentAnalysis>>({})
  const [aiOpening, setAiOpening] = useState<string | null>(null)
  const [aiOpeningLoading, setAiOpeningLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const s = await getDebate(id as string)
      if (!s) { router.push("/"); return }
      setSession(s)
      setCurrentRound(s.rounds.length + 1)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!session || !session.aiGoesFirst || session.rounds.length > 0) return
    setAiOpeningLoading(true)
    argue({
      topic: session.topic,
      user_side: session.userSide,
      round_number: 1,
      history: [],
    }).then(res => setAiOpening(res.argument))
      .catch(console.error)
      .finally(() => setAiOpeningLoading(false))
  }, [session?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session?.rounds, aiOpening])

  async function submitArgument() {
    if (!session || !input.trim() || loading) return
    const userContent = input.trim()
    setInput("")
    setLoading(true)

    const history: Message[] = []
    if (session.aiGoesFirst && aiOpening && session.rounds.length === 0) {
      history.push({ role: "assistant", content: aiOpening })
    }
    session.rounds.forEach(r => {
      history.push({ role: "user" as const, content: r.userArgument })
      history.push({ role: "assistant" as const, content: r.aiArgument })
    })
    history.push({ role: "user", content: userContent })

    try {
      // Start the analyser right away. Don't await it, so it never blocks the debate.
      analyse({
        topic: session.topic,
        user_side: session.userSide,
        round_number: currentRound,
        argument: userContent,
      }).then(analysis => {
        setAnalyses(prev => ({ ...prev, [currentRound]: analysis }))
      }).catch(console.error)

      const res = await argue({
        topic: session.topic,
        user_side: session.userSide,
        round_number: currentRound,
        history,
      })

      const newRound: Round = {
        number: currentRound as 1 | 2 | 3,
        name: ["opening", "rebuttal", "closing"][currentRound - 1] as Round["name"],
        userArgument: userContent,
        aiArgument: res.argument,
      }

      const updatedSession: DebateSession = {
        ...session,
        rounds: [...session.rounds, newRound],
        status: currentRound === 3 ? "complete" : "debating",
      }

      saveDebate(updatedSession)
      setSession(updatedSession)
      setCurrentRound(prev => prev + 1)

      if (currentRound === 3) {
        setTimeout(() => router.push(`/verdict/${session.id}`), 1500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null
  const sideLabel = session.userSide === "for" ? "FOR" : "AGAINST"
  const charsLeft = CHAR_LIMIT - input.length
  const charWarning = charsLeft < 60

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col selection:bg-red-500/30 selection:text-red-200">

      {/* ─── BG TEXTURE ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* ─── HEADER ─── */}
      <div className="relative z-20 border-b border-zinc-900 px-5 py-3.5 flex items-center justify-between sticky top-0 bg-[#080808]/95 backdrop-blur-md">

        <div className="flex items-center gap-3 min-w-0">
          {/* Abandon */}
          <button
            onClick={() => {
              if (confirm("Abandon this debate? Your progress will be saved.")) router.push("/")
            }}
            className="text-[10px] font-mono uppercase tracking-widest text-zinc-700 hover:text-red-500 border border-zinc-900 hover:border-red-500/30 px-3 py-1.5 transition-all flex-shrink-0"
          >
            ✕ Abandon
          </button>

          {/* Topic + side */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">VS AI</span>
              <span className="text-zinc-800">·</span>
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                session.userSide === "for" ? "text-emerald-600" : "text-red-500"
              }`}>
                You argue {sideLabel}
              </span>
            </div>
            <h2 className="text-white font-bold text-sm truncate max-w-[200px] sm:max-w-xs">
              {session.topic}
            </h2>
          </div>
        </div>

        {/* Round tracker */}
        <div className="flex gap-3 flex-shrink-0">
          {[1, 2, 3].map(r => (
            <div key={r} className="flex flex-col items-center gap-1">
              <motion.div
                className={`w-8 h-px transition-colors ${
                  r < currentRound ? "bg-red-500" :
                  r === currentRound ? "bg-white" : "bg-zinc-800"
                }`}
                animate={{ scaleX: r === currentRound ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.5, repeat: r === currentRound ? Infinity : 0, repeatDelay: 2 }}
              />
              <span className={`text-[9px] font-mono uppercase tracking-widest ${
                r < currentRound ? "text-red-500/60" :
                r === currentRound ? "text-zinc-400" : "text-zinc-800"
              }`}>
                {ROUND_NAMES[r - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── DEBATE THREAD ─── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-8 max-w-2xl w-full mx-auto space-y-8">

        {/* AI goes first — opening */}
        {session.aiGoesFirst && (
          <div className="space-y-3">
            <RoundDivider label="Opening — agAInst" />
            {aiOpeningLoading ? (
              <AITyping />
            ) : aiOpening ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <AIBubble content={aiOpening} />
              </motion.div>
            ) : null}
          </div>
        )}

        <AnimatePresence>
          {session.rounds.map((round, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Round divider — skip if AI opened round 1 */}
              {!(session.aiGoesFirst && round.number === 1) && (
                <RoundDivider label={ROUND_NAMES[round.number - 1]} />
              )}

              {/* User bubble */}
              <motion.div
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}>
                <UserBubble content={round.userArgument} />
              </motion.div>

              {/* Analysis panel */}
              {analyses[round.number] && (
                <AnalysisPanel analysis={analyses[round.number]} round={round.number} />
              )}

              {/* AI bubble */}
              <motion.div
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.08 }}>
                <AIBubble content={round.aiArgument} />
              </motion.div>

            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI thinking */}
        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <AITyping />
          </motion.div>
        )}

        {/* Debate complete redirect state */}
        {session.status === "complete" && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-8 space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-zinc-800 border-b-zinc-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
            </div>
            <p className="text-zinc-600 text-[11px] font-mono uppercase tracking-[0.3em]">
              Debate complete — judge deliberating…
            </p>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── INPUT ─── */}
      {currentRound <= 3 && !loading && session.status !== "complete" &&
       (!session.aiGoesFirst || aiOpening) && (
        <motion.div
          className="relative z-20 border-t border-zinc-900 bg-[#080808]/95 backdrop-blur-md px-4 py-4 max-w-2xl w-full mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Round label strip */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              session.userSide === "for" ? "bg-emerald-500" : "bg-red-500"
            }`} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
              {ROUND_NAMES[currentRound - 1]}
            </span>
            <span className="text-zinc-800">·</span>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${
              session.userSide === "for" ? "text-emerald-600" : "text-red-500"
            }`}>
              You · {sideLabel}
            </span>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/60 focus-within:border-red-500/30 focus-within:bg-zinc-900 transition-all">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value.slice(0, CHAR_LIMIT))}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submitArgument()
                }
              }}
              placeholder={ROUND_HINTS[currentRound - 1]}
              rows={3}
              className="w-full bg-transparent px-4 pt-4 pb-2 text-white placeholder-zinc-700 text-sm focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className={`text-xs font-mono transition-colors ${
                charWarning ? "text-red-400" : "text-zinc-700"
              }`}>
                {charsLeft}
              </span>
              <button
                onClick={submitArgument}
                disabled={!input.trim()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-25 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-[0.98]"
              >
                Submit →
              </button>
            </div>
          </div>
          <p className="text-zinc-800 text-[10px] font-mono mt-2 text-center uppercase tracking-widest">
            Enter to submit · Shift+Enter for new line
          </p>
        </motion.div>
      )}
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function RoundDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-zinc-900" />
      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-700">{label}</span>
      <div className="flex-1 h-px bg-zinc-900" />
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3 flex-row-reverse">
      <div className="w-7 h-7 bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black text-red-400">
        Y
      </div>
      <div className="border border-red-500/15 bg-red-500/5 px-5 py-4 max-w-lg relative">
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-red-500/20" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-red-500/70 mb-2">You</p>
        <p className="text-zinc-200 text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

function AIBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black text-zinc-400">
        AI
      </div>
      <div className="border border-zinc-800 bg-zinc-900/60 px-5 py-4 max-w-lg relative">
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-2">agAInst</p>
        <p className="text-zinc-200 text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

function AITyping() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black text-zinc-400">
        AI
      </div>
      <div className="border border-zinc-800 bg-zinc-900/60 px-5 py-4 relative">
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-zinc-600 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}