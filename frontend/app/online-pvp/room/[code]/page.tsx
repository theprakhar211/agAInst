"use client"
// frontend/app/online-pvp/room/[code]/page.tsx

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { UserMenu } from "@/components/UserMenu"
import {
  getRoom, subscribeToRoom, submitArgument, getPlayerId,
  type OnlinePvPRoom
} from "@/lib/onlinePvp"
import { pvpJudge } from "@/lib/api"

const ROUND_NAMES = ["Opening", "Rebuttal", "Closing"]
const ROUND_HINTS = [
  "Make your opening argument...",
  "Rebut your opponent...",
  "Make your closing statement...",
]
const CHAR_LIMIT = 400

export default function OnlinePvPRoomPage() {
  const { code } = useParams()
  const router = useRouter()

  const [room, setRoom] = useState<OnlinePvPRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const playerId = useRef(getPlayerId())
  const judgeTriggered = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const myRole = typeof window !== "undefined"
    ? localStorage.getItem(`room_player_${code}`) as "player1" | "player2" | null
    : null
  const isPlayer1 = myRole === "player1"
  const isPlayer2 = myRole === "player2"

  useEffect(() => {
    if (!code) return
    getRoom(code as string).then(r => {
      if (!r) { router.push("/online-pvp"); return }
      setRoom(r)
      setLoading(false)
    })
    const unsub = subscribeToRoom(code as string, updated => setRoom(updated))
    return unsub
  }, [code, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [room?.rounds, room?.status])

  useEffect(() => {
    if (!room || room.status !== "judging" || !isPlayer1 || judgeTriggered.current) return
    judgeTriggered.current = true

    async function runJudge() {
      const freshRoom = await getRoom(code as string)
      if (!freshRoom) { console.error("[pvp judge] could not fetch fresh room"); return }
      if (freshRoom.rounds.length === 0) { console.error("[pvp judge] rounds empty — aborting"); return }

      const history = freshRoom.rounds.flatMap(r => [
        { role: "user" as const, content: `${freshRoom.player1_name}: ${r.player1Argument}` },
        { role: "assistant" as const, content: `${freshRoom.player2_name}: ${r.player2Argument}` },
      ])

      try {
        const verdict = await pvpJudge({
          topic: freshRoom.topic,
          p1_name: freshRoom.player1_name,
          p2_name: freshRoom.player2_name ?? "Player 2",
          p1_side: freshRoom.player1_side,
          history,
        })
        const { getSupabaseClient } = await import("@/lib/supabase")
        const supabase = getSupabaseClient()
        await supabase.from("online_pvp_rooms").update({ verdict, status: "complete" }).eq("code", code)
      } catch (e) {
        console.error("[pvp judge] judge call failed:", e)
      }
    }

    runJudge()
  }, [room?.status, isPlayer1, code])

  useEffect(() => {
    if (room?.status === "complete" && room.verdict) {
      setTimeout(() => router.push(`/online-pvp/verdict/${code}`), 800)
    }
  }, [room?.status, room?.verdict, code, router])

  async function handleSubmit() {
    if (!room || !input.trim() || submitting) return
    setSubmitting(true)
    await submitArgument(code as string, playerId.current, input.trim(), room)
    setInput("")
    setSubmitting(false)
  }

  function copyShareLink() {
    if (!room) return
    navigator.clipboard.writeText(`${window.location.origin}/online-pvp?token=${room.share_token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyCode() {
    if (!room) return
    navigator.clipboard.writeText(room.code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (loading) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
      <div className="text-center space-y-3 relative z-10">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-zinc-800 border-b-zinc-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
        </div>
        <p className="text-zinc-600 text-[11px] font-mono uppercase tracking-[0.3em]">Connecting...</p>
      </div>
    </main>
  )

  if (!room) return null

  const currentRoundNumber = room.status === "waiting" ? 0
    : room.status === "judging" || room.status === "complete" ? 4
    : parseInt(room.status.replace("round", ""))

  const myPendingSubmit = isPlayer1 ? room.p1_submitted : room.p2_submitted
  const theirPendingSubmit = isPlayer1 ? room.p2_submitted : room.p1_submitted
  const myName = isPlayer1 ? room.player1_name : room.player2_name
  const theirName = isPlayer1 ? room.player2_name : room.player1_name
  const mySide = isPlayer1 ? room.player1_side : room.player2_side
  const canSubmit = room.status.startsWith("round") && !myPendingSubmit && !submitting
  const waitingForThem = !!myPendingSubmit && !theirPendingSubmit

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col selection:bg-red-500/30 selection:text-red-200">

      {/* ─── BG TEXTURE ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* ─── HEADER ─── */}
      <div className="relative z-20 border-b border-zinc-900 px-5 py-3.5 flex items-center justify-between sticky top-0 bg-[#080808]/95 backdrop-blur-md">
        <div className="flex items-center gap-4 min-w-0">
          {/* Mode badge */}
          <div className="hidden sm:flex items-center gap-1.5 border border-zinc-800 px-2.5 py-1.5 flex-shrink-0">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Online</span>
            <span className="text-zinc-700 font-mono">·</span>
            <span className="text-[10px] font-mono text-zinc-600 tracking-widest">{room.code}</span>
          </div>

          {/* Topic */}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate max-w-[200px] sm:max-w-xs">{room.topic}</p>
            {room.status !== "waiting" && room.player2_name && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-red-500">{room.player1_name}</span>
                <span className="text-[10px] font-mono text-zinc-700">FOR —</span>
                <span className="text-[10px] font-mono text-blue-500">{room.player2_name}</span>
                <span className="text-[10px] font-mono text-zinc-700">AGAINST</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Round pips */}
          {currentRoundNumber > 0 && currentRoundNumber <= 3 && (
            <div className="flex gap-1.5 items-center">
              {[1, 2, 3].map(r => (
                <div key={r} className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-px transition-colors ${
                    r < currentRoundNumber ? "bg-red-500" :
                    r === currentRoundNumber ? "bg-white" : "bg-zinc-800"
                  }`} />
                  <span className={`text-[9px] font-mono uppercase ${
                    r <= currentRoundNumber ? "text-zinc-600" : "text-zinc-800"
                  }`}>{ROUND_NAMES[r - 1]}</span>
                </div>
              ))}
            </div>
          )}
          <UserMenu />
        </div>
      </div>

      {/* ─── THREAD ─── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-8 max-w-2xl w-full mx-auto space-y-6">

        {/* Waiting for opponent */}
        {room.status === "waiting" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 space-y-8">

            {/* Pulsing waiting indicator */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border border-zinc-800 rotate-45" />
              <div className="absolute inset-3 border border-dashed border-zinc-700 rotate-45 animate-spin [animation-duration:8s]" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-zinc-600">?</div>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-2">Awaiting Opponent</p>
              <p className="text-white font-black text-xl uppercase tracking-tight mb-1">Waiting for player 2</p>
              <p className="text-zinc-600 text-sm font-mono">Share the code or link below</p>
            </div>

            {/* Room code display */}
            <div className="max-w-xs mx-auto space-y-2">
              <div className="flex items-center justify-between border border-zinc-800 bg-zinc-900/50 px-5 py-4 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 mb-1">Room Code</p>
                  <span className="font-mono text-3xl font-black tracking-[0.3em] text-white">{room.code}</span>
                </div>
                <button onClick={copyCode}
                  className={`text-[10px] font-mono uppercase tracking-widest transition-colors px-3 py-1.5 border ${
                    codeCopied
                      ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                      : "text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-700"
                  }`}>
                  {codeCopied ? "✓ Copied" : "Copy"}
                </button>
              </div>

              <button onClick={copyShareLink}
                className="w-full flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/60 py-3 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-all">
                🔗 {copied ? "Link copied!" : "Copy invite link"}
              </button>
            </div>

            {/* Your identity */}
            <div className="border border-zinc-800 bg-zinc-900/30 p-4 max-w-xs mx-auto text-left relative">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 mb-3">You are playing as</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-600 flex items-center justify-center text-sm font-black text-white">
                  {room.player1_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{room.player1_name}</p>
                  <p className={`text-[10px] font-mono uppercase tracking-widest mt-0.5 ${
                    room.player1_side === "for" ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {room.player1_side}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Players joined banner */}
        {room.status !== "waiting" && room.player2_name && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-900" />
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
              <span className="text-red-500">{room.player1_name}</span>
              <span className="text-zinc-800">for</span>
              <span className="text-zinc-800">—</span>
              <span className="text-blue-500">{room.player2_name}</span>
              <span className="text-zinc-800">against</span>
            </div>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
        )}

        {/* Completed rounds */}
        {room.rounds.map((round, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Round label */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-900" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-700">
                {ROUND_NAMES[round.number - 1]}
              </span>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>

            {/* P1 argument */}
            <motion.div className="flex gap-3 flex-row-reverse"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <div className="w-7 h-7 bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black text-red-400">
                {room.player1_name[0].toUpperCase()}
              </div>
              <div className="border border-red-500/15 bg-red-500/5 px-5 py-4 max-w-lg relative">
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-red-500/20" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-red-500 mb-2">
                  {room.player1_name} · For
                </p>
                <p className="text-zinc-200 text-sm leading-relaxed">{round.player1Argument}</p>
              </div>
            </motion.div>

            {/* P2 argument */}
            <motion.div className="flex gap-3"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
              <div className="w-7 h-7 bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black text-blue-400">
                {room.player2_name?.[0].toUpperCase()}
              </div>
              <div className="border border-blue-500/15 bg-blue-500/5 px-5 py-4 max-w-lg relative">
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-blue-500/20" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-blue-500 mb-2">
                  {room.player2_name} · Against
                </p>
                <p className="text-zinc-200 text-sm leading-relaxed">{round.player2Argument}</p>
              </div>
            </motion.div>

          </motion.div>
        ))}

        {/* My pending submission */}
        {room.status.startsWith("round") && myPendingSubmit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`flex gap-3 ${isPlayer1 ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 border flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black ${
              isPlayer1
                ? "bg-red-600/20 border-red-500/30 text-red-400"
                : "bg-blue-600/20 border-blue-500/30 text-blue-400"
            }`}>
              {myName?.[0].toUpperCase()}
            </div>
            <div className={`border px-5 py-4 max-w-lg opacity-50 ${
              isPlayer1
                ? "border-red-500/15 bg-red-500/5"
                : "border-blue-500/15 bg-blue-500/5"
            }`}>
              <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-2 ${
                isPlayer1 ? "text-red-500" : "text-blue-500"
              }`}>
                {myName} · submitted
                <span className="text-emerald-500">✓</span>
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed">{myPendingSubmit}</p>
            </div>
          </motion.div>
        )}

        {/* Waiting for opponent */}
        {waitingForThem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
              Waiting for {theirName}…
            </span>
          </motion.div>
        )}

        {/* Judging */}
        {room.status === "judging" && (
          <div className="text-center py-10 space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-zinc-800 border-b-zinc-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
            </div>
            <p className="text-zinc-600 text-[11px] font-mono uppercase tracking-[0.3em]">
              Debate complete — judge deliberating…
            </p>
          </div>
        )}

        {room.status === "complete" && (
          <div className="text-center py-4">
            <p className="text-zinc-600 text-[11px] font-mono uppercase tracking-widest">
              Redirecting to verdict…
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── INPUT ─── */}
      {canSubmit && room.status !== "waiting" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-20 border-t border-zinc-900 bg-[#080808]/95 backdrop-blur-md px-4 py-4 max-w-2xl w-full mx-auto">

          {/* Player identity strip */}
          <div className={`flex items-center gap-2 mb-2 text-[10px] font-mono uppercase tracking-widest ${
            isPlayer1 ? "text-red-500" : "text-blue-500"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlayer1 ? "bg-red-500" : "bg-blue-500"}`} />
            {myName}
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-600">{mySide}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-600">{ROUND_NAMES[currentRoundNumber - 1]}</span>
          </div>

          <div className={`border bg-zinc-900/60 transition-colors focus-within:bg-zinc-900 ${
            isPlayer1
              ? "border-zinc-800 focus-within:border-red-500/30"
              : "border-zinc-800 focus-within:border-blue-500/30"
          }`}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value.slice(0, CHAR_LIMIT))}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit() }
              }}
              placeholder={ROUND_HINTS[currentRoundNumber - 1]}
              rows={3}
              className="w-full bg-transparent px-4 pt-4 pb-2 text-white placeholder-zinc-700 text-sm focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className={`text-xs font-mono transition-colors ${
                CHAR_LIMIT - input.length < 60 ? "text-red-400" : "text-zinc-700"
              }`}>
                {CHAR_LIMIT - input.length}
              </span>
              <button onClick={handleSubmit} disabled={!input.trim() || submitting}
                className={`px-5 py-2 text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-[0.98] ${
                  isPlayer1
                    ? "bg-red-600 hover:bg-red-700 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                }`}>
                {submitting ? "Sending…" : "Submit →"}
              </button>
            </div>
          </div>
          <p className="text-zinc-800 text-[10px] font-mono mt-2 text-center uppercase tracking-widest">
            Both players submit independently · Enter to submit
          </p>
        </motion.div>
      )}
    </main>
  )
}