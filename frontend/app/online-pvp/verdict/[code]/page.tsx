"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { UserMenu } from "@/components/UserMenu"
import { getRoom, type OnlinePvPRoom } from "@/lib/onlinePvp"

const SCORE_LABELS = ["logic", "evidence", "rebuttal", "clarity"]
const SCORE_ICONS: Record<string, string> = {
  logic: "⚡", evidence: "📊", rebuttal: "🔄", clarity: "💡",
}

export default function OnlinePvPVerdictPage() {
  const { code } = useParams()
  const router = useRouter()
  const [room, setRoom] = useState<OnlinePvPRoom | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    getRoom(code as string).then(r => {
      if (!r) { router.push("/"); return }
      setRoom(r); setLoading(false)
    })
  }, [code, router])

  if (loading) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-14 h-14 mx-auto">
          <div className="absolute inset-0 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-zinc-800 border-b-zinc-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
        </div>
        <p className="text-zinc-600 text-[11px] font-mono uppercase tracking-[0.3em]">Loading verdict...</p>
      </div>
    </main>
  )

  if (!room || !room.verdict) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center space-y-4 border border-zinc-800 p-8 relative">
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500/30" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500/30" />
        <p className="text-zinc-500 text-sm font-mono">Verdict not ready yet.</p>
        <button onClick={() => window.location.reload()}
          className="text-xs font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 border border-zinc-800 hover:border-zinc-600 px-4 py-2 transition-all">
          Refresh
        </button>
      </div>
    </main>
  )

  const v = room.verdict
  const winnerIsP1 = v.winner === room.player1_name

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">

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

      <div className="max-w-2xl mx-auto px-4 pt-32 pb-24 space-y-3">

        {/* ─── Topic badge ─── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Online PvP · Verdict</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">{room.topic}</h1>
          {/* Players */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-sm font-bold text-red-400 mb-0.5">{room.player1_name}</div>
              <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">For</div>
            </div>
            <div className="text-zinc-800 font-mono text-sm">—vs—</div>
            <div className="text-center">
              <div className="text-sm font-bold text-blue-400 mb-0.5">{room.player2_name}</div>
              <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">Against</div>
            </div>
          </div>
        </div>

        {/* ─── Winner hero ─── */}
        <motion.div
          className="relative overflow-hidden border p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 60%)",
            borderColor: "rgba(16,185,129,0.25)",
          }}
          initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
        >
          {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r",
            "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((pos, i) => (
            <div key={i} className={`absolute w-5 h-5 ${pos} border-emerald-500/40`} />
          ))}

          <div className="inline-block border border-emerald-500/30 px-3 py-1 mb-6">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500">Match Over</span>
          </div>
          <div className="text-6xl font-black uppercase tracking-tighter mb-2 text-emerald-400"
            style={{ textShadow: "0 0 40px rgba(16,185,129,0.3)" }}>
            {v.winner} wins
          </div>
          <div className="text-3xl mb-5">🏆</div>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">{v.reasoning}</p>
        </motion.div>

        {/* ─── Score breakdown ─── */}
        <motion.div className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {[
            { name: room.player1_name, scores: v.player1_scores, color: "red", isWinner: winnerIsP1 },
            { name: room.player2_name, scores: v.player2_scores, color: "blue", isWinner: !winnerIsP1 },
          ].map(({ name, scores, color, isWinner }) => (
            <div key={name} className="bg-zinc-900/40 border border-zinc-800 p-5 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />
              <div className="flex items-center justify-between mb-4">
                <p className={`text-[10px] font-mono uppercase tracking-widest truncate ${
                  color === "red" ? "text-red-400" : "text-blue-400"
                }`}>{name}</p>
                {isWinner && (
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border border-emerald-500/30 text-emerald-500 bg-emerald-500/5 flex-shrink-0 ml-2">
                    Winner
                  </span>
                )}
              </div>
              <div className="space-y-3.5">
                {SCORE_LABELS.map((label, idx) => {
                  const val = scores?.[label] ?? 0
                  return (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                          {SCORE_ICONS[label]} {label}
                        </span>
                        <span className="text-xs font-black text-zinc-300 font-mono">
                          {val}<span className="text-zinc-700">/10</span>
                        </span>
                      </div>
                      <div className="h-px bg-zinc-800 overflow-hidden">
                        <motion.div
                          className={`h-full ${color === "red" ? "bg-red-500" : "bg-blue-500"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${val * 10}%` }}
                          transition={{ duration: 0.7, delay: 0.4 + idx * 0.1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ─── Strongest argument ─── */}
        {v.strongest_argument && (
          <motion.div className="border border-zinc-800 bg-zinc-900/30 p-5 relative"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3">⭐ Strongest argument</p>
            <p className="text-zinc-300 text-sm leading-relaxed font-light italic">&ldquo;{v.strongest_argument}&rdquo;</p>
          </motion.div>
        )}

        {/* ─── Fallacies ─── */}
        {v.fallacies?.length > 0 && (
          <motion.div className="border border-amber-500/15 bg-amber-500/5 p-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-600 mb-3">⚠ Fallacies detected</p>
            <div className="flex flex-wrap gap-2">
              {v.fallacies.map((f: string) => (
                <span key={f} className="text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1">
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Actions ─── */}
        <motion.div className="space-y-2 pt-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <button onClick={() => router.push("/online-pvp")}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.99] flex items-center justify-center gap-2">
            ⚔️ Play again
          </button>
          <button onClick={() => router.push("/")}
            className="w-full py-3.5 border border-zinc-800 hover:border-zinc-600 text-zinc-600 hover:text-zinc-400 transition-all text-xs font-mono uppercase tracking-widest">
            ← New debate
          </button>
        </motion.div>

      </div>
    </main>
  )
}