"use client"
// frontend/app/online-pvp/page.tsx

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { UserMenu } from "@/components/UserMenu"
import { createRoom, joinRoom, joinRoomByToken, getPlayerId } from "@/lib/onlinePvp"

type Mode = "home" | "create" | "join"

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
    setLoading(true); setError(null)
    const playerId = getPlayerId()
    const room = await createRoom(topic.trim(), playerName.trim(), side, playerId)
    setLoading(false)
    if (!room) { setError("Failed to create room. Try again."); return }
    localStorage.setItem(`room_player_${room.code}`, "player1")
    router.push(`/online-pvp/room/${room.code}`)
  }

  async function handleJoin() {
    const code = joinCode.trim()
    const name = playerName.trim()
    if (!code || !name) return
    setLoading(true); setError(null)
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
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">

      {/* ─── BG TEXTURE ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[280px] bg-green-500/6 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-red-600/6 blur-[100px] rounded-full" />
      </div>

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 bg-[#080808]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/logo3.png" alt="agAInst logo" width={56} height={56} priority className="rounded-md" />
            <span className="text-xl font-black tracking-tighter uppercase hidden sm:block">
              ag<span className="text-red-600">AIN</span>st
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/history")}
              className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 transition-all">
              📚 Past debates
            </button>
            <UserMenu />
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-36 pb-24">

        {/* ─── HEADER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Online PvP</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-3">
            Debate a <span className="text-red-600" style={{ textShadow: "0 0 30px rgba(220,38,38,0.3)" }}>real person</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
            Create a room and share the link, or join with a code. Two players, one topic, real time.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ─── HOME ─── */}
          {mode === "home" && (
            <motion.div key="home"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-3">

              <button onClick={() => setMode("create")}
                className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all hover:shadow-[0_0_25px_rgba(220,38,38,0.35)] active:scale-[0.99] relative group">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20" />
                ⚔️ Create a room
              </button>

              <button onClick={() => setMode("join")}
                className="w-full py-5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-white font-black uppercase tracking-widest text-sm transition-all active:scale-[0.99] relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-zinc-700" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-zinc-700" />
                🔗 Join a room
              </button>

              {/* How it works */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-zinc-900 mt-6">
                {[
                  { num: "01", text: "Create or join a room" },
                  { num: "02", text: "Share the link or code" },
                  { num: "03", text: "Argue 3 rounds live" },
                ].map(step => (
                  <div key={step.num} className="text-center">
                    <div className="text-xl font-black text-red-600/50 mb-1">{step.num}</div>
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── CREATE ─── */}
          {mode === "create" && (
            <motion.div key="create"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">

              <button onClick={() => { setMode("home"); setError(null) }}
                className="text-[11px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors mb-1">
                ← Back
              </button>

              {/* Section label */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-zinc-900" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-600">Create Room</span>
                <div className="flex-1 h-px bg-zinc-900" />
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 block mb-2">
                  Your name
                </label>
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-red-500/40 px-4 py-3 text-white placeholder-zinc-700 text-sm outline-none transition-colors font-mono"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 block mb-2">
                  Topic
                </label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="Enter debate topic..."
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-red-500/40 px-4 py-3 text-white placeholder-zinc-700 text-sm outline-none transition-colors"
                />
              </div>

              {/* Side selector */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 block mb-2">
                  Your side
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["for", "against"] as const).map(s => (
                    <button key={s} onClick={() => setSide(s)}
                      className={`py-3 text-xs font-mono uppercase tracking-widest border transition-all ${
                        side === s
                          ? s === "for"
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)]"
                            : "bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                          : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                      }`}>
                      {s === "for" ? "For" : "Against"}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 relative">
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-red-500/30" />
                  <p className="text-red-400 text-xs font-mono">{error}</p>
                </div>
              )}

              <button onClick={handleCreate}
                disabled={!topic.trim() || !playerName.trim() || loading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-25 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-sm transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.99]">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating room...
                  </span>
                ) : "Create room →"}
              </button>
            </motion.div>
          )}

          {/* ─── JOIN ─── */}
          {mode === "join" && (
            <motion.div key="join"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">

              {!shareToken && (
                <button onClick={() => { setMode("home"); setError(null) }}
                  className="text-[11px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors mb-1">
                  ← Back
                </button>
              )}

              {/* Section label */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-zinc-900" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                  {shareToken ? "You've been invited" : "Join Room"}
                </span>
                <div className="flex-1 h-px bg-zinc-900" />
              </div>

              {/* Invite card */}
              {shareToken && (
                <div className="border border-green-500/20 bg-green-500/5 p-4 text-center relative">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-500/30" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-green-500/30" />
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-green-400 text-xs font-mono uppercase tracking-widest">Room link detected</p>
                  </div>
                  <p className="text-zinc-500 text-xs font-mono">Enter your name to join the debate</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 block mb-2">
                  Your name
                </label>
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-red-500/40 px-4 py-3 text-white placeholder-zinc-700 text-sm outline-none transition-colors font-mono"
                />
              </div>

              {/* Room code */}
              {!shareToken && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 block mb-2">
                    Room code
                  </label>
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={e => e.key === "Enter" && handleJoin()}
                    placeholder="000000"
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-red-500/40 px-4 py-3 text-white placeholder-zinc-800 text-xl outline-none transition-colors tracking-[0.4em] font-mono text-center"
                    maxLength={6}
                  />
                  {/* Code digit indicators */}
                  <div className="flex gap-1.5 mt-2 justify-center">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`flex-1 h-px transition-colors ${
                        i < joinCode.length ? "bg-red-600" : "bg-zinc-800"
                      }`} />
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 relative">
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-red-500/30" />
                  <p className="text-red-400 text-xs font-mono">{error}</p>
                </div>
              )}

              <button onClick={handleJoin}
                disabled={(!shareToken && joinCode.length !== 6) || !playerName.trim() || loading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-25 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-sm transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.99]">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining...
                  </span>
                ) : "Join room →"}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}

export default function OnlinePvPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
          <p className="text-zinc-600 text-[11px] font-mono uppercase tracking-[0.3em]">Loading lobby...</p>
        </div>
      </div>
    }>
      <LobbyContent />
    </Suspense>
  )
}