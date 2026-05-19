"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { getDebate, saveDebate } from "@/lib/storage"
import { argue, analyse } from "@/lib/api"
import { DebateSession, Message, Round, ArgumentAnalysis } from "@/lib/types"
import AnalysisPanel from "@/components/AnalysisPanel"

const ROUND_NAMES = ["Opening", "Rebuttal", "Closing"]
const CHAR_LIMIT = 400

export default function DebatePage() {
  const { id } = useParams()
  const router = useRouter()
  const [session, setSession] = useState<DebateSession | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [analyses, setAnalyses] = useState<Record<number, ArgumentAnalysis>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = getDebate(id as string)
    if (!s) { router.push("/"); return }
    setSession(s)
    setCurrentRound(s.rounds.length + 1)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session?.rounds])

  async function submitArgument() {
    if (!session || !input.trim() || loading) return
    const userContent = input.trim()
    setInput("")
    setLoading(true)

    const history: Message[] = session.rounds.flatMap(r => [
      { role: "user" as const, content: r.userArgument },
      { role: "assistant" as const, content: r.aiArgument },
    ])
    history.push({ role: "user", content: userContent })

    try {
      const [res, analysis] = await Promise.all([
        argue({
          topic: session.topic,
          user_side: session.userSide,
          round_number: currentRound,
          history,
        }),
        analyse({
          topic: session.topic,
          user_side: session.userSide,
          round_number: currentRound,
          argument: userContent,
        }),
      ])

      setAnalyses(prev => ({ ...prev, [currentRound]: analysis }))

      const newRound: Round = {
        number: currentRound as 1 | 2 | 3,
        name: ["opening", "rebuttal", "closing"][currentRound - 1] as Round["name"],
        userArgument: userContent,
        aiArgument: res.argument,
        analysis,
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
        setTimeout(() => router.push(`/verdict/${session.id}`), 1200)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null
  const sideLabel = session.userSide === "for" ? "FOR" : "AGAINST"

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Debating</p>
          <h2 className="text-white font-semibold text-sm max-w-md truncate">{session.topic}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
            You: {sideLabel}
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(r => (
              <motion.div
                key={r}
                className={`w-2 h-2 rounded-full ${
                  r < currentRound ? "bg-red-500" :
                  r === currentRound ? "bg-white" : "bg-zinc-700"
                }`}
                animate={{ scale: r === currentRound ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.4 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Debate thread */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-3xl w-full mx-auto">
        <AnimatePresence>
          {session.rounds.map((round, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Round label */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-zinc-500 text-xs uppercase tracking-widest">
                  Round {round.number} — {ROUND_NAMES[round.number - 1]}
                </span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              {/* User bubble */}
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-lg bg-red-500/10 border border-red-500/20 rounded-2xl rounded-tr-sm px-5 py-4">
                  <p className="text-xs text-red-400 font-medium mb-2">You</p>
                  <p className="text-zinc-200 text-sm leading-relaxed">{round.userArgument}</p>
                </div>
              </motion.div>

              {/* Analysis panel */}
              {round.analysis && (
                <AnalysisPanel analysis={round.analysis} round={round.number} />
              )}

              {/* AI bubble */}
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl rounded-tl-sm px-5 py-4">
                  <p className="text-xs text-zinc-400 font-medium mb-2">agAInst</p>
                  <p className="text-zinc-200 text-sm leading-relaxed">{round.aiArgument}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl rounded-tl-sm px-5 py-4">
              <p className="text-xs text-zinc-400 font-medium mb-2">agAInst</p>
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {currentRound <= 3 && !loading && session.status !== "complete" && (
        <motion.div
          className="border-t border-zinc-800 px-6 py-4 max-w-3xl w-full mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2 justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">
              Round {currentRound} — {ROUND_NAMES[currentRound - 1]}
            </span>
            <span className={`text-xs ${input.length > CHAR_LIMIT * 0.9 ? "text-red-400" : "text-zinc-500"}`}>
              {input.length}/{CHAR_LIMIT}
            </span>
          </div>
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value.slice(0, CHAR_LIMIT))}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submitArgument()
                }
              }}
              placeholder={
                currentRound === 1 ? "Make your opening argument..." :
                currentRound === 2 ? "Rebut their argument..." :
                "Make your closing statement..."
              }
              rows={3}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
            <button
              onClick={submitArgument}
              disabled={!input.trim()}
              className="px-5 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-zinc-600 text-xs mt-2">Enter to submit · Shift+Enter for new line</p>
        </motion.div>
      )}
    </main>
  )
}