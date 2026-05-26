"use client"
// frontend/app/online-pvp/page.tsx
// Lobby: create a room or join by code/link

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { UserMenu } from "@/components/UserMenu"
import { createRoom, joinRoom, joinRoomByToken, getPlayerId } from "@/lib/onlinePvp"

type Mode = "home" | "create" | "join"

// 1. Move all the search parameter operations and UI state inside a separate component
function LobbyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("token") ? "join" : "home"
  )
  const [topic, setTopic] = useState("")
  const [side, setSide] = useState<"for" | "against">("for")
  const [playerName, setPlayerName] = useState(
    () => user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? ""
  )
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareToken = searchParams.get("token")

  async function handleCreate() {
    if (!topic.trim() || !playerName.trim()) return
    setLoading(true)
    setError(null)
    const playerId = getPlayerId()
    const room = await createRoom(topic.trim(), playerName.trim(), side, playerId)
    setLoading(false)
    if (!room) { setError("Failed to create room. Try again."); return }
    // Store which player we are
    localStorage.setItem(`room_player_${room.code}`, "player1")
    router.push(`/online-pvp/room/${room.code}`)
  }

  async function handleJoin() {
    const code = joinCode.trim()
    const name = playerName.trim()
    if (!code || !name) return
    setLoading(true)
    setError(null)
    const playerId = getPlayerId()
    const { room, error } = shareToken
      ? await joinRoomByToken(shareToken, name, playerId)
      : await joinRoom(code, name, playerId)
    setLoading(false)
    if (error || !room) { setError(error ?? "Failed to join."); return }
    localStorage.setItem(`room_player_${room.code}`, "player2")
    router.push(`/online-pvp/room/${room.code}`)
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
          <Image src="/logo3.png" alt="agAInst logo" width={102} height={102} priority className="rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/history")}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-all">
            📚 Past debates
          </button>
          <UserMenu />
        </div>
      </nav>

      <div className="max-w-md mx-auto px-6 py-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3.5 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
            <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">Online PvP</span>
          </div>
          <h1 className="text-3xl font-black mb-3">
            Debate a <span className="text-red-500">real person</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Create a room and share the code, or join a friend's room. Both players debate on separate devices in real time.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* Home — pick create or join */}
          {mode === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <button
                onClick={() => setMode("create")}
                className="w-full py-5 bg-red-500 hover:bg-red-600 text-white font-bold text-base rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                ⚔️ Create a room
              </button>
              <button
                onClick={() => setMode("join")}
                className="w-full py-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-base rounded-2xl transition-all"
              >
                🔗 Join a room
              </button>
            </motion.div>
          )}

          {/* Create room */}
          {mode === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button onClick={() => setMode("home")} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2">
                ← Back
              </button>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Your name</label>
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Topic</label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Enter debate topic..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Your side</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["for", "against"] as const).map(s => (
                    <button key={s} onClick={() => setSide(s)}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        side === s
                          ? s === "for"
                            ? "bg-red-500 border-red-500 text-white"
                            : "bg-blue-500 border-blue-500 text-white"
                          : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      }`}>
                      {s === "for" ? "✅ FOR" : "❌ AGAINST"}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-400 text-xs bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

              <button
                onClick={handleCreate}
                disabled={!topic.trim() || !playerName.trim() || loading}
                className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
              >
                {loading ? "Creating room..." : "Create room →"}
              </button>
            </motion.div>
          )}

          {/* Join room */}
          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {!shareToken && (
                <button onClick={() => setMode("home")} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2">
                  ← Back
                </button>
              )}

              {shareToken && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center mb-2">
                  <p className="text-green-400 text-sm font-medium">🔗 You've been invited!</p>
                  <p className="text-zinc-500 text-xs mt-1">Enter your name to join the debate</p>
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Your name</label>
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors"
                />
              </div>

              {!shareToken && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Room code</label>
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code..."
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors tracking-widest font-mono text-center text-lg"
                    maxLength={6}
                  />
                </div>
              )}

              {error && <p className="text-red-400 text-xs bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

              <button
                onClick={handleJoin}
                disabled={(!shareToken && joinCode.length !== 6) || !playerName.trim() || loading}
                className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
              >
                {loading ? "Joining..." : "Join room →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

// 2. Keep this as your main default export wrapped in a Suspense boundary
export default function OnlinePvPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-zinc-500 text-sm font-mono">
        Loading lobby...
      </div>
    }>
      <LobbyContent />
    </Suspense>
  )
}