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
const CHAR_LIMIT = 400

export default function OnlinePvPRoomPage() {
  const { code } = useParams()
  const router = useRouter()

  const [room, setRoom] = useState<OnlinePvPRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const playerId = useRef(getPlayerId())
  const judgeTriggered = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Determine which player we are from localStorage
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

  // Player 1 triggers judging
  useEffect(() => {
    if (!room || room.status !== "judging" || !isPlayer1 || judgeTriggered.current) return
    judgeTriggered.current = true

    const history = room.rounds.flatMap(r => [
      { role: "user" as const, content: `${room.player1_name}: ${r.player1Argument}` },
      { role: "assistant" as const, content: `${room.player2_name}: ${r.player2Argument}` },
    ])

    pvpJudge({
      topic: room.topic,
      p1_name: room.player1_name,
      p2_name: room.player2_name ?? "Player 2",
      p1_side: room.player1_side,
      history,
    }).then(async verdict => {
      const { getSupabaseClient } = await import("@/lib/supabase")
      const supabase = getSupabaseClient()
      await supabase
        .from("online_pvp_rooms")
        .update({ verdict, status: "complete" })
        .eq("code", code)
    }).catch(console.error)
  }, [room?.status, isPlayer1, code, room])

  // Redirect both players to verdict when complete
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

  if (loading) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
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
    <main className="min-h-screen bg-[#080808] text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#080808]/90 backdrop-blur-sm z-10">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-500">Online PvP</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs font-mono text-zinc-500">{room.code}</span>
          </div>
          <p className="text-sm font-medium text-white truncate max-w-xs">{room.topic}</p>
        </div>
        <div className="flex items-center gap-2">
          {currentRoundNumber > 0 && currentRoundNumber <= 3 && (
            <div className="flex gap-1.5 mr-2">
              {[1, 2, 3].map(r => (
                <div key={r} className={`w-6 h-1 rounded-full transition-colors ${
                  r < currentRoundNumber ? "bg-red-500" :
                  r === currentRoundNumber ? "bg-white" : "bg-zinc-800"
                }`} />
              ))}
            </div>
          )}
          <UserMenu />
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-8 max-w-2xl w-full mx-auto space-y-6">

        {/* Waiting for opponent */}
        {room.status === "waiting" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 space-y-6">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center text-2xl mx-auto animate-pulse">?</div>
            <div>
              <p className="text-white font-bold text-lg mb-1">Waiting for opponent…</p>
              <p className="text-zinc-500 text-sm">Share the room code or link</p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <div className="flex items-center justify-between px-5 py-4 bg-zinc-900 border border-zinc-700 rounded-xl">
                <span className="font-mono text-3xl font-black tracking-widest text-white">{room.code}</span>
                <button onClick={() => { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  {copied ? "✓" : "Copy"}
                </button>
              </div>
              <button onClick={copyShareLink}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl text-sm text-zinc-400 hover:text-white transition-all">
                🔗 {copied ? "Copied!" : "Copy invite link"}
              </button>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 max-w-xs mx-auto text-left">
              <p className="text-xs text-zinc-500 mb-2">You are playing as:</p>
              <p className="text-white font-semibold">{room.player1_name}</p>
              <p className={`text-xs mt-1 font-medium ${room.player1_side === "for" ? "text-red-400" : "text-blue-400"}`}>
                {room.player1_side === "for" ? "✅ FOR" : "❌ AGAINST"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Player joined banner */}
        {room.status !== "waiting" && room.player2_name && (
          <div className="flex items-center justify-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <span className="text-red-400 font-medium">{room.player1_name}</span>
              <span>FOR</span>
              <span className="text-zinc-700">vs</span>
              <span className="text-blue-400 font-medium">{room.player2_name}</span>
              <span>AGAINST</span>
            </div>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
        )}

        {/* Completed rounds */}
        {room.rounds.map((round, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800/60" />
              <span className="text-zinc-600 text-xs uppercase tracking-widest">{ROUND_NAMES[round.number - 1]}</span>
              <div className="h-px flex-1 bg-zinc-800/60" />
            </div>
            <motion.div className="flex gap-3 flex-row-reverse" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
              <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-red-400">
                {room.player1_name[0]}
              </div>
              <div className="bg-red-500/8 border border-red-500/15 rounded-2xl rounded-tr-sm px-5 py-4 max-w-lg">
                <p className="text-xs text-red-400 font-medium mb-2">{room.player1_name} · FOR</p>
                <p className="text-zinc-200 text-sm leading-relaxed">{round.player1Argument}</p>
              </div>
            </motion.div>
            <motion.div className="flex gap-3" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-blue-400">
                {room.player2_name?.[0]}
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl rounded-tl-sm px-5 py-4 max-w-lg">
                <p className="text-xs text-blue-400 font-medium mb-2">{room.player2_name} · AGAINST</p>
                <p className="text-zinc-200 text-sm leading-relaxed">{round.player2Argument}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}

        {/* Current round — show my pending submission */}
        {room.status.startsWith("round") && myPendingSubmit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`flex gap-3 ${isPlayer1 ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold ${
              isPlayer1 ? "bg-red-500/20 border border-red-500/30 text-red-400" : "bg-blue-500/20 border border-blue-500/30 text-blue-400"
            }`}>
              {myName?.[0]}
            </div>
            <div className={`border rounded-2xl px-5 py-4 max-w-lg opacity-60 ${
              isPlayer1 ? "bg-red-500/8 border-red-500/15 rounded-tr-sm" : "bg-blue-500/5 border-blue-500/10 rounded-tl-sm"
            }`}>
              <p className={`text-xs font-medium mb-2 ${isPlayer1 ? "text-red-400" : "text-blue-400"}`}>
                {myName} · submitted ✓
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed">{myPendingSubmit}</p>
            </div>
          </motion.div>
        )}

        {/* Waiting for them */}
        {waitingForThem && (
          <div className="flex items-center gap-3 text-zinc-500 text-sm py-2">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span>Waiting for {theirName}…</span>
          </div>
        )}

        {/* Judging */}
        {room.status === "judging" && (
          <div className="text-center py-8 space-y-3">
            <div className="w-8 h-8 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 text-sm">Debate complete — judge is deliberating…</p>
          </div>
        )}

        {room.status === "complete" && (
          <div className="text-center py-4">
            <p className="text-zinc-500 text-sm">Redirecting to verdict…</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canSubmit && room.status !== "waiting" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/5 bg-[#080808]/90 backdrop-blur-sm px-4 py-4 max-w-2xl w-full mx-auto">
          <div className={`rounded-2xl overflow-hidden border transition-colors ${
            isPlayer1 ? "bg-zinc-900 border-zinc-800 focus-within:border-red-500/40"
                      : "bg-zinc-900 border-zinc-800 focus-within:border-blue-500/40"
          }`}>
            <div className={`px-5 pt-3 pb-1 text-xs font-medium flex items-center gap-2 ${isPlayer1 ? "text-red-400" : "text-blue-400"}`}>
              <span>{myName}</span>
              <span className="text-zinc-600">·</span>
              <span className="uppercase text-zinc-500">{mySide}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500">{ROUND_NAMES[currentRoundNumber - 1]}</span>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value.slice(0, CHAR_LIMIT))}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              placeholder={
                currentRoundNumber === 1 ? "Make your opening argument..." :
                currentRoundNumber === 2 ? "Rebut your opponent..." : "Make your closing statement..."
              }
              rows={3}
              className="w-full bg-transparent px-5 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-5 pb-3">
              <span className="text-xs text-zinc-600">{CHAR_LIMIT - input.length} chars left</span>
              <button onClick={handleSubmit} disabled={!input.trim() || submitting}
                className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-30 ${
                  isPlayer1 ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                }`}>
                Submit →
              </button>
            </div>
          </div>
          <p className="text-zinc-700 text-xs mt-2 text-center">Both players submit independently — you can submit in any order</p>
        </motion.div>
      )}
    </main>
  )
}
