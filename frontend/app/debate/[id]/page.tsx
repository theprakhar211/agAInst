"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { getDebate, saveDebate } from "@/lib/storage"
import { argue, analyse } from "@/lib/api"
import { DebateSession, Message, Round, ArgumentAnalysis } from "@/lib/types"
import AnalysisPanel from "@/components/AnalysisPanel"

const ROUND_NAMES = ["Opening", "Rebuttal", "Closing"]
const ROUND_HINTS = [
  "Establish your core position clearly",
  "Directly address what they just said",
  "Land your strongest point and summarise",
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
    const s = getDebate(id as string)
    if (!s) { router.push("/"); return }
    setSession(s)
    setCurrentRound(s.rounds.length + 1)
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

      analyse({
        topic: session.topic,
        user_side: session.userSide,
        round_number: currentRound,
        argument: userContent,
      }).then(analysis => {
        setAnalyses(prev => ({ ...prev, [currentRound]: analysis }))
      }).catch(console.error)

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
    <main className="min-h-screen bg-[#080808] text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-[#080808]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm"
          >
            ←
          </button>
          <div>
            <p className="text-zinc-600 text-xs mb-0.5">
              You argue <span className="text-red-400 font-medium">{sideLabel}</span>
            </p>
            <h2 className="text-white font-medium text-sm max-w-sm truncate">{session.topic}</h2>
          </div>
        </div>

        {/* Round progress */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {[1, 2, 3].map(r => (
              <div key={r} className="flex flex-col items-center gap-1">
                <motion.div
                  className={`w-8 h-1 rounded-full transition-colors ${
                    r < currentRound ? "bg-red-500" :
                    r === currentRound ? "bg-white" : "bg-zinc-800"
                  }`}
                  animate={{ scaleX: r === currentRound ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.4 }}
                />
                <span className={`text-[10px] ${r <= currentRound ? "text-zinc-400" : "text-zinc-700"}`}>
                  {ROUND_NAMES[r - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Debate thread */}
      <div className="flex-1 overflow-y-auto px-4 py-8 max-w-2xl w-full mx-auto space-y-8">

        {/* AI goes first */}
        {session.aiGoesFirst && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800/60" />
              <span className="text-zinc-600 text-xs uppercase tracking-widest">Opening — agAInst</span>
              <div className="h-px flex-1 bg-zinc-800/60" />
            </div>
            {aiOpeningLoading ? (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-5 py-4">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            ) : aiOpening ? (
              <motion.div className="flex gap-3"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-zinc-400">
                  A
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-5 py-4 max-w-lg">
                  <p className="text-zinc-200 text-sm leading-relaxed">{aiOpening}</p>
                </div>
              </motion.div>
            ) : null}
          </div>
        )}

        <AnimatePresence>
          {session.rounds.map((round, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {!(session.aiGoesFirst && round.number === 1) && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-800/60" />
                  <span className="text-zinc-600 text-xs uppercase tracking-widest">
                    {ROUND_NAMES[round.number - 1]}
                  </span>
                  <div className="h-px flex-1 bg-zinc-800/60" />
                </div>
              )}

              {/* User bubble */}
              <motion.div className="flex gap-3 flex-row-reverse"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-red-400">
                  Y
                </div>
                <div className="bg-red-500/8 border border-red-500/15 rounded-2xl rounded-tr-sm px-5 py-4 max-w-lg">
                  <p className="text-zinc-200 text-sm leading-relaxed">{round.userArgument}</p>
                </div>
              </motion.div>

              {/* Analysis */}
              {analyses[round.number] && (
                <AnalysisPanel analysis={analyses[round.number]} round={round.number} />
              )}

              {/* AI bubble */}
              <motion.div className="flex gap-3"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-zinc-400">
                  A
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-5 py-4 max-w-lg">
                  <p className="text-zinc-200 text-sm leading-relaxed">{round.aiArgument}</p>
                </div>
              </motion.div>

            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <motion.div className="flex gap-3"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-zinc-400">
              A
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {currentRound <= 3 && !loading && session.status !== "complete" &&
       (!session.aiGoesFirst || aiOpening) && (
        <motion.div
          className="border-t border-white/5 bg-[#080808]/90 backdrop-blur-sm px-4 py-4 max-w-2xl w-full mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden focus-within:border-zinc-600 transition-colors">
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
              className="w-full bg-transparent px-5 pt-4 pb-2 text-white placeholder-zinc-600 text-sm focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                  {ROUND_NAMES[currentRound - 1]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs transition-colors ${charWarning ? "text-red-400" : "text-zinc-600"}`}>
                  {charsLeft}
                </span>
                <button
                  onClick={submitArgument}
                  disabled={!input.trim()}
                  className="px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                >
                  Submit →
                </button>
              </div>
            </div>
          </div>
          <p className="text-zinc-700 text-xs mt-2 text-center">Enter to submit · Shift+Enter for new line</p>
        </motion.div>
      )}
    </main>
  )
}