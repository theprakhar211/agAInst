"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { getPvPSession, savePvPSession } from "@/lib/cloudStorage"
import { analyse, pvpJudge } from "@/lib/api"
import { PvPSession, PvPRound, ArgumentAnalysis } from "@/lib/types"

const ROUND_NAMES = ["Opening", "Rebuttal", "Closing"]
const CHAR_LIMIT = 400

type Turn = "player1" | "player2" | "handoff" | "complete"

export default function PvPPage() {
  const { id } = useParams()
  const router = useRouter()
  const [session, setSession] = useState<PvPSession | null>(null)
  const [input, setInput] = useState("")
  const [turn, setTurn] = useState<Turn>("player1")
  const [currentRound, setCurrentRound] = useState(1)
  const [p1Analysis, setP1Analysis] = useState<Record<number, ArgumentAnalysis>>({})
  const [p2Analysis, setP2Analysis] = useState<Record<number, ArgumentAnalysis>>({})
  const [pendingP1Arg, setPendingP1Arg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = getPvPSession(id as string)
    if (!s) { router.push("/"); return }
    setSession(s)
    setCurrentRound(s.rounds.length + 1)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session?.rounds, turn])

  async function submitP1() {
    if (!session || !input.trim()) return
    const arg = input.trim()
    setInput("")
    setPendingP1Arg(arg)
    setTurn("handoff")

    // Analyse P1 in background
    analyse({
      topic: session.topic,
      user_side: session.player1Side,
      round_number: currentRound,
      argument: arg,
    }).then(a => setP1Analysis(prev => ({ ...prev, [currentRound]: a })))
      .catch(console.error)
  }

  async function submitP2() {
    if (!session || !input.trim() || !pendingP1Arg) return
    const arg = input.trim()
    setInput("")
    setIsSubmitting(true)

    // Analyse P2 in background
    analyse({
      topic: session.topic,
      user_side: session.player2Side,
      round_number: currentRound,
      argument: arg,
    }).then(a => setP2Analysis(prev => ({ ...prev, [currentRound]: a })))
      .catch(console.error)

    const newRound: PvPRound = {
      number: currentRound as 1 | 2 | 3,
      name: ["opening", "rebuttal", "closing"][currentRound - 1] as any,
      player1Argument: pendingP1Arg,
      player2Argument: arg,
    }

    const updatedSession: PvPSession = {
      ...session,
      rounds: [...session.rounds, newRound],
      status: currentRound === 3 ? "complete" : "debating",
    }

    await savePvPSession(updatedSession)
    setSession(updatedSession)
    setPendingP1Arg(null)
    setIsSubmitting(false)

    if (currentRound === 3) {
      setTurn("complete")
      // Build history for judge
      const history = updatedSession.rounds.flatMap(r => [
        { role: "user" as const, content: `${session.player1Name}: ${r.player1Argument}` },
        { role: "assistant" as const, content: `${session.player2Name}: ${r.player2Argument}` },
      ])
      pvpJudge({
        topic: session.topic,
        p1_name: session.player1Name,
        p2_name: session.player2Name,
        p1_side: session.player1Side,
        history,
      }).then(verdict => {
        localStorage.setItem(`pvp_verdict_${session.id}`, JSON.stringify(verdict))
        setTimeout(() => router.push(`/pvp/verdict/${session.id}`), 1000)
      }).catch(console.error)
    } else {
      setCurrentRound(prev => prev + 1)
      setTurn("player1")
    }
  }

  if (!session) return null

  const activeTurn = turn === "player1" ? session.player1Name : session.player2Name
  const activeSide = turn === "player1" ? session.player1Side : session.player2Side

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#080808]/90 backdrop-blur-sm z-10">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-zinc-500">2 Player</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-400 font-medium truncate max-w-xs">{session.topic}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-red-400 font-medium">{session.player1Name}</span>
            <span className="text-zinc-600">FOR</span>
            <span className="text-zinc-700">vs</span>
            <span className="text-blue-400 font-medium">{session.player2Name}</span>
            <span className="text-zinc-600">AGAINST</span>
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(r => (
            <div key={r} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-1 rounded-full transition-colors ${
                r < currentRound ? "bg-zinc-500" :
                r === currentRound ? "bg-white" : "bg-zinc-800"
              }`} />
              <span className={`text-[10px] ${r <= currentRound ? "text-zinc-400" : "text-zinc-700"}`}>
                {ROUND_NAMES[r - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Debate thread */}
      <div className="flex-1 overflow-y-auto px-4 py-8 max-w-2xl w-full mx-auto space-y-6">
        {session.rounds.map((round, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800/60" />
              <span className="text-zinc-600 text-xs uppercase tracking-widest">{ROUND_NAMES[round.number - 1]}</span>
              <div className="h-px flex-1 bg-zinc-800/60" />
            </div>

            {/* P1 */}
            <motion.div className="flex gap-3 flex-row-reverse"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
              <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-red-400">
                {session.player1Name[0]}
              </div>
              <div className="bg-red-500/8 border border-red-500/15 rounded-2xl rounded-tr-sm px-5 py-4 max-w-lg">
                <p className="text-xs text-red-400 font-medium mb-2">{session.player1Name} · FOR</p>
                <p className="text-zinc-200 text-sm leading-relaxed">{round.player1Argument}</p>
                {p1Analysis[round.number] && (
                  <div className="mt-3 pt-3 border-t border-red-500/10 text-xs text-zinc-500">
                    💡 {p1Analysis[round.number].one_liner_feedback}
                  </div>
                )}
              </div>
            </motion.div>

            {/* P2 */}
            <motion.div className="flex gap-3"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-blue-400">
                {session.player2Name[0]}
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl rounded-tl-sm px-5 py-4 max-w-lg">
                <p className="text-xs text-blue-400 font-medium mb-2">{session.player2Name} · AGAINST</p>
                <p className="text-zinc-200 text-sm leading-relaxed">{round.player2Argument}</p>
                {p2Analysis[round.number] && (
                  <div className="mt-3 pt-3 border-t border-blue-500/10 text-xs text-zinc-500">
                    💡 {p2Analysis[round.number].one_liner_feedback}
                  </div>
                )}
              </div>
            </motion.div>

          </motion.div>
        ))}

        {turn === "complete" && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            Debate complete — judge is deliberating...
            <div className="w-6 h-6 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin mx-auto mt-4" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Handoff screen — blur between turns */}
      <AnimatePresence>
        {turn === "handoff" && (
          <motion.div
            className="fixed inset-0 bg-[#080808]/95 backdrop-blur-md flex flex-col items-center justify-center z-50 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl font-bold text-blue-400">
              {session.player2Name[0]}
            </div>
            <div className="text-center">
              <p className="text-zinc-400 text-sm mb-1">Pass the device to</p>
              <p className="text-white text-2xl font-bold">{session.player2Name}</p>
              <p className="text-zinc-500 text-sm mt-2">
                Round {currentRound} — {ROUND_NAMES[currentRound - 1]}
              </p>
            </div>
            <button
              onClick={() => setTurn("player2")}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all hover:scale-105"
            >
              I&apos;m ready →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {(turn === "player1" || turn === "player2") && (
        <motion.div
          className="border-t border-white/5 bg-[#080808]/90 backdrop-blur-sm px-4 py-4 max-w-2xl w-full mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`rounded-2xl overflow-hidden border transition-colors ${
            turn === "player1"
              ? "bg-zinc-900 border-zinc-800 focus-within:border-red-500/40"
              : "bg-zinc-900 border-zinc-800 focus-within:border-blue-500/40"
          }`}>
            <div className={`px-5 pt-3 pb-1 text-xs font-medium flex items-center gap-2 ${
              turn === "player1" ? "text-red-400" : "text-blue-400"
            }`}>
              <span>{activeTurn}</span>
              <span className="text-zinc-600">·</span>
              <span className="uppercase text-zinc-500">{activeSide}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500">{ROUND_NAMES[currentRound - 1]}</span>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value.slice(0, CHAR_LIMIT))}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  turn === "player1" ? submitP1() : submitP2()
                }
              }}
              placeholder={
                currentRound === 1 ? "Make your opening argument..." :
                currentRound === 2 ? "Rebut your opponent..." :
                "Make your closing statement..."
              }
              rows={3}
              className="w-full bg-transparent px-5 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-5 pb-3">
              <span className="text-xs text-zinc-600">{CHAR_LIMIT - input.length} chars left</span>
              <button
                onClick={() => turn === "player1" ? submitP1() : submitP2()}
                disabled={!input.trim() || isSubmitting}
                className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30 ${
                  turn === "player1"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                Submit →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  )
}