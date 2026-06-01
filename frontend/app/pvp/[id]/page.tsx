"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { getPvPSession, savePvPSession } from "@/lib/cloudStorage"
import { analyse, pvpJudge } from "@/lib/api"
import { PvPSession, PvPRound, ArgumentAnalysis } from "@/lib/types"

const ROUND_NAMES = ["Opening", "Rebuttal", "Closing"]
const ROUND_HINTS = [
  "Make your opening argument...",
  "Rebut your opponent...",
  "Make your closing statement...",
]
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
    analyse({
      topic: session.topic,
      user_side: session.player1Side,
      round_number: currentRound,
      argument: arg,
    }).then(a => setP1Analysis(prev => ({ ...prev, [currentRound]: a }))).catch(console.error)
  }

  async function submitP2() {
    if (!session || !input.trim() || !pendingP1Arg) return
    const arg = input.trim()
    setInput("")
    setIsSubmitting(true)

    analyse({
      topic: session.topic,
      user_side: session.player2Side,
      round_number: currentRound,
      argument: arg,
    }).then(a => setP2Analysis(prev => ({ ...prev, [currentRound]: a }))).catch(console.error)

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

  const activeName = turn === "player1" ? session.player1Name : session.player2Name
  const activeSide = turn === "player1" ? session.player1Side : session.player2Side
  const charsLeft = CHAR_LIMIT - input.length
  const charWarning = charsLeft < 60

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col selection:bg-red-500/30 selection:text-red-200">

      {/* BG TEXTURE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* HEADER */}
      <div className="relative z-20 border-b border-zinc-900 px-5 py-3.5 flex items-center justify-between sticky top-0 bg-[#080808]/95 backdrop-blur-md">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">2 Player</span>
            <span className="text-zinc-800">·</span>
            <span className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">{session.topic}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest">
            <span className="text-red-500">{session.player1Name}</span>
            <span className="text-zinc-800">for —</span>
            <span className="text-blue-500">{session.player2Name}</span>
            <span className="text-zinc-800">against</span>
          </div>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          {[1, 2, 3].map(r => (
            <div key={r} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-px transition-colors ${
                r < currentRound ? "bg-zinc-600" :
                r === currentRound ? "bg-white" : "bg-zinc-800"
              }`} />
              <span className={`text-[9px] font-mono uppercase tracking-widest ${
                r < currentRound ? "text-zinc-700" :
                r === currentRound ? "text-zinc-400" : "text-zinc-800"
              }`}>
                {ROUND_NAMES[r - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* DEBATE THREAD */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-8 max-w-2xl w-full mx-auto space-y-6">

        {session.rounds.map((round, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-900" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-700">
                {ROUND_NAMES[round.number - 1]}
              </span>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>

            {/* P1 bubble */}
            <motion.div className="flex gap-3 flex-row-reverse"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <div className="w-7 h-7 bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black text-red-400">
                {session.player1Name[0].toUpperCase()}
              </div>
              <div className="border border-red-500/15 bg-red-500/5 px-5 py-4 max-w-lg relative">
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-red-500/20" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-red-500 mb-2">
                  {session.player1Name} · For
                </p>
                <p className="text-zinc-200 text-sm leading-relaxed">{round.player1Argument}</p>
                {p1Analysis[round.number] && (
                  <div className="mt-3 pt-3 border-t border-red-500/10">
                    <p className="text-[10px] font-mono text-zinc-600">
                      💡 {p1Analysis[round.number].one_liner_feedback}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* P2 bubble */}
            <motion.div className="flex gap-3"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
              <div className="w-7 h-7 bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black text-blue-400">
                {session.player2Name[0].toUpperCase()}
              </div>
              <div className="border border-blue-500/15 bg-blue-500/5 px-5 py-4 max-w-lg relative">
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-blue-500/20" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-blue-500 mb-2">
                  {session.player2Name} · Against
                </p>
                <p className="text-zinc-200 text-sm leading-relaxed">{round.player2Argument}</p>
                {p2Analysis[round.number] && (
                  <div className="mt-3 pt-3 border-t border-blue-500/10">
                    <p className="text-[10px] font-mono text-zinc-600">
                      💡 {p2Analysis[round.number].one_liner_feedback}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

          </motion.div>
        ))}

        {turn === "complete" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-10 space-y-4">
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

      {/* HANDOFF SCREEN */}
      <AnimatePresence>
        {turn === "handoff" && (
          <motion.div
            className="fixed inset-0 bg-[#080808]/97 backdrop-blur-lg flex flex-col items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
              backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }} />

            <div className="relative z-10 flex flex-col items-center gap-8 text-center px-6">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-3xl font-black text-blue-400">
                  {session.player2Name[0].toUpperCase()}
                </div>
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-blue-500/30" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-blue-500/30" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-blue-500/30" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-blue-500/30" />
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-3">Hand device to</p>
                <p className="text-white text-3xl font-black uppercase tracking-tight mb-1">{session.player2Name}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">Round {currentRound}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">{ROUND_NAMES[currentRound - 1]}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600">Against</span>
                </div>
              </div>

              <button
                onClick={() => setTurn("player2")}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.35)] active:scale-[0.99] relative"
              >
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20" />
                I&apos;m ready →
              </button>

              <p className="text-zinc-800 text-[10px] font-mono uppercase tracking-widest">
                {session.player1Name}&apos;s argument is hidden until both submit
</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT */}
      {(turn === "player1" || turn === "player2") && (
        <motion.div
          className="relative z-20 border-t border-zinc-900 bg-[#080808]/95 backdrop-blur-md px-4 py-4 max-w-2xl w-full mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full ${turn === "player1" ? "bg-red-500" : "bg-blue-500"}`} />
            <span className={`text-[10px] font-mono uppercase tracking-widest ${turn === "player1" ? "text-red-500" : "text-blue-500"}`}>
              {activeName}
            </span>
            <span className="text-zinc-800">·</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">{activeSide}</span>
            <span className="text-zinc-800">·</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">{ROUND_NAMES[currentRound - 1]}</span>
          </div>

          <div className={`border bg-zinc-900/60 transition-all focus-within:bg-zinc-900 ${
            turn === "player1"
              ? "border-zinc-800 focus-within:border-red-500/30"
              : "border-zinc-800 focus-within:border-blue-500/30"
          }`}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value.slice(0, CHAR_LIMIT))}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  turn === "player1" ? submitP1() : submitP2()
                }
              }}
              placeholder={ROUND_HINTS[currentRound - 1]}
              rows={3}
              className="w-full bg-transparent px-4 pt-4 pb-2 text-white placeholder-zinc-700 text-sm focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className={`text-xs font-mono transition-colors ${charWarning ? "text-red-400" : "text-zinc-700"}`}>
                {charsLeft}
              </span>
              <button
                onClick={() => turn === "player1" ? submitP1() : submitP2()}
                disabled={!input.trim() || isSubmitting}
                className={`px-5 py-2 text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-[0.98] ${
                  turn === "player1"
                    ? "bg-red-600 hover:bg-red-700 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                }`}
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