"use client"
// frontend/app/online-pvp/verdict/[code]/page.tsx

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { UserMenu } from "@/components/UserMenu"
import { getRoom, type OnlinePvPRoom } from "@/lib/onlinePvp"

const SCORE_LABELS = ["logic", "evidence", "rebuttal", "clarity"]
const SCORE_ICONS: Record<string, string> = {
  logic: "⚡", evidence: "📊", rebuttal: "🔄", clarity: "💡"
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
      setRoom(r)
      setLoading(false)
    })
  }, [code, router])

  if (loading) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
    </main>
  )

  if (!room || !room.verdict) return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center">
      <p className="text-zinc-500">Verdict not ready yet. Try refreshing.</p>
    </main>
  )

  const v = room.verdict

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

      <div className="max-w-2xl mx-auto px-4 pt-12 pb-24 space-y-4">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Online PvP Verdict</p>
          <h1 className="text-xl font-bold">{room.topic}</h1>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <span className="text-red-400 font-medium">{room.player1_name}</span>
            <span className="text-zinc-600 text-xs">FOR</span>
            <span className="text-zinc-700">vs</span>
            <span className="text-blue-400 font-medium">{room.player2_name}</span>
            <span className="text-zinc-600 text-xs">AGAINST</span>
          </div>
        </div>

        {/* Winner */}
        <motion.div
          className="rounded-2xl border p-8 text-center bg-emerald-500/5 border-emerald-500/20"
          initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
        >
          <div className="text-5xl font-black text-emerald-400 mb-2">{v.winner} wins</div>
          <div className="text-3xl mb-4">🏆</div>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">{v.reasoning}</p>
        </motion.div>

        {/* Scores */}
        <motion.div className="grid grid-cols-2 gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {[
            { name: room.player1_name, scores: v.player1_scores, color: "red" },
            { name: room.player2_name, scores: v.player2_scores, color: "blue" },
          ].map(({ name, scores, color }) => (
            <div key={name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4 truncate">{name}</p>
              <div className="space-y-3">
                {SCORE_LABELS.map((label, idx) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                        {SCORE_ICONS[label]} {label}
                      </span>
                      <span className="text-xs font-medium text-zinc-300">{scores?.[label]}/10</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${color === "red" ? "bg-red-500" : "bg-blue-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(scores?.[label] ?? 0) * 10}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + idx * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Strongest argument */}
        {v.strongest_argument && (
          <motion.div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">⭐ Strongest argument</p>
            <p className="text-zinc-300 text-sm leading-relaxed italic">&ldquo;{v.strongest_argument}&rdquo;</p>
          </motion.div>
        )}

        {/* Fallacies */}
        {v.fallacies?.length > 0 && (
          <motion.div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <p className="text-xs text-amber-600 uppercase tracking-widest mb-3">⚠️ Fallacies detected</p>
            <div className="flex flex-wrap gap-2">
              {v.fallacies.map((f: string) => (
                <span key={f} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div className="space-y-3 pt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <button onClick={() => router.push("/online-pvp")}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-red-500/40 text-zinc-300 hover:text-white rounded-xl transition-all text-sm font-medium">
            ⚔️ Play again
          </button>
          <button onClick={() => router.push("/")}
            className="w-full py-3.5 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 rounded-xl transition-all text-sm">
            ← New debate
          </button>
        </motion.div>

      </div>
    </main>
  )
}
