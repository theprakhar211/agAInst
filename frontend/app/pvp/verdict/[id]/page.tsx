"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getPvPSession, saveDebate } from "@/lib/storage"
import { PvPSession } from "@/lib/types"

const SCORE_LABELS = ["logic", "evidence", "rebuttal", "clarity"]
const SCORE_ICONS: Record<string, string> = {
  logic: "⚡", evidence: "📊", rebuttal: "🔄", clarity: "💡"
}

export default function PvPVerdictPage() {
  const { id } = useParams()
  const router = useRouter()
  const [session, setSession] = useState<PvPSession | null>(null)
  const [verdict, setVerdict] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getPvPSession(id as string)
    if (!s) { router.push("/"); return }
    setSession(s)

    const cached = localStorage.getItem(`pvp_verdict_${id}`)
    if (cached) {
      setVerdict(JSON.parse(cached))
      setLoading(false)
    }
  }, [id])

  if (!session) return null

  return (
    <main className="min-h-screen bg-[#080808] text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        <button onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-all mb-8">
          ← New debate
        </button>

        <div className="text-center mb-10">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">2 Player Verdict</p>
          <h1 className="text-2xl font-bold">{session.topic}</h1>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <span className="text-red-400 font-medium">{session.player1Name}</span>
            <span className="text-zinc-600">vs</span>
            <span className="text-blue-400 font-medium">{session.player2Name}</span>
          </div>
        </div>

        {loading && (
          <div className="text-center py-24">
            <div className="w-10 h-10 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">Judge is deliberating...</p>
          </div>
        )}

        {verdict && (
          <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Winner */}
            <motion.div
              className="rounded-2xl border p-8 text-center bg-emerald-500/5 border-emerald-500/20"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-5xl font-black text-emerald-400 mb-2">{verdict.winner} wins</div>
              <div className="text-3xl mb-4">🏆</div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">{verdict.reasoning}</p>
            </motion.div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: session.player1Name, scores: verdict.player1_scores, color: "red" },
                { name: session.player2Name, scores: verdict.player2_scores, color: "blue" },
              ].map(({ name, scores, color }) => (
                <div key={name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">{name}</p>
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
                            transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Strongest argument */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">⭐ Strongest argument</p>
              <p className="text-zinc-300 text-sm leading-relaxed italic">&ldquo;{verdict.strongest_argument}&rdquo;</p>
            </div>

            {/* Fallacies */}
            {verdict.fallacies?.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-5">
                <p className="text-xs text-amber-600 uppercase tracking-widest mb-3">⚠️ Fallacies detected</p>
                <div className="flex flex-wrap gap-2">
                  {verdict.fallacies.map((f: string) => (
                    <span key={f} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => router.push("/")}
              className="w-full py-3.5 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 rounded-xl transition-all text-sm">
              ← New debate
            </button>

          </motion.div>
        )}
      </div>
    </main>
  )
}