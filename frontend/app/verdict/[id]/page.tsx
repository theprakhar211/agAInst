"use client"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { judge } from "@/lib/api"
import { DebateSession } from "@/lib/types"
import { getDebate, getVerdict, saveVerdict, saveDebate } from "@/lib/storage"

interface Verdict {
  winner: "user" | "ai"
  user_scores: Record<string, number>
  ai_scores: Record<string, number>
  strongest_argument: string
  reasoning: string
  fallacies: string[]
}

const SCORE_LABELS = ["logic", "evidence", "rebuttal", "clarity"]
const SCORE_ICONS: Record<string, string> = {
  logic: "⚡", evidence: "📊", rebuttal: "🔄", clarity: "💡"
}

export default function VerdictPage() {
  const { id } = useParams()
  const router = useRouter()
  const shareRef = useRef<HTMLDivElement>(null)
  const [session, setSession] = useState<DebateSession | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getDebate(id as string)
    if (!s || s.status !== "complete") { router.push("/"); return }
    setSession(s)

    const cached = getVerdict(id as string)
    if (cached) { setVerdict(cached); setLoading(false); return }

    const history = s.rounds.flatMap(r => [
      { role: "user" as const, content: r.userArgument },
      { role: "assistant" as const, content: r.aiArgument },
    ])

    judge({ topic: s.topic, user_side: s.userSide, history })
      .then(v => { saveVerdict(id as string, v); setVerdict(v) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function shareDebate() {
    if (!shareRef.current) return
    const canvas = await html2canvas(shareRef.current, {
      backgroundColor: "#080808", scale: 2,
    })
    const link = document.createElement("a")
    link.download = `agAInst-${session?.topic?.slice(0, 20)}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  function startSideFlip() {
    if (!session) return
    const flipped = {
      id: crypto.randomUUID(),
      topic: session.topic,
      userSide: (session.userSide === "for" ? "against" : "for") as "for" | "against",
      rounds: [],
      status: "debating" as const,
      createdAt: Date.now(),
      aiGoesFirst: Math.random() < 0.5,
    }
    saveDebate(flipped)
    router.push(`/debate/${flipped.id}`)
  }

  function exportPDF() {
    if (!session || !verdict) return
    const doc = new jsPDF()
    let y = 20
    const line = (text: string, size = 11, bold = false) => {
      doc.setFontSize(size); doc.setFont("helvetica", bold ? "bold" : "normal")
      const lines = doc.splitTextToSize(text, 170)
      lines.forEach((l: string) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(l, 20, y); y += 8
      }); y += 2
    }
    line("agAInst — Debate Transcript", 18, true)
    line(`Topic: ${session.topic}`, 13, true)
    line(`Your side: ${session.userSide.toUpperCase()}`)
    line(`Date: ${new Date(session.createdAt).toLocaleDateString()}`)
    y += 4
    session.rounds.forEach(r => {
      line(`Round ${r.number} — ${["Opening","Rebuttal","Closing"][r.number-1]}`, 13, true)
      line(`You: ${r.userArgument}`, 10)
      y += 2
      line(`agAInst: ${r.aiArgument}`, 10)
      y += 4
    })
    y += 4
    line("Verdict", 14, true)
    line(`Winner: ${verdict.winner === "user" ? "You" : "agAInst"}`, 12, true)
    line(`Reasoning: ${verdict.reasoning}`, 10)
    SCORE_LABELS.forEach(l => {
      line(`${l}: You ${verdict.user_scores[l]}/10 vs agAInst ${verdict.ai_scores[l]}/10`, 10)
    })
    if (verdict.strongest_argument) line(`Strongest: "${verdict.strongest_argument}"`, 10)
    doc.save(`agAInst-${session.topic.slice(0, 30)}.pdf`)
  }

  if (!session) return null

  const userTotal = verdict ? SCORE_LABELS.reduce((s, l) => s + verdict.user_scores[l], 0) : 0
  const aiTotal = verdict ? SCORE_LABELS.reduce((s, l) => s + verdict.ai_scores[l], 0) : 0

  return (
    <main className="min-h-screen bg-[#080808] text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-all"
          >
            ← New debate
          </button>
          <button
            onClick={() => router.push("/history")}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            History →
          </button>
        </div>

        {/* Topic header */}
        <div className="text-center mb-10">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Verdict</p>
          <h1 className="text-2xl font-bold text-white leading-snug">{session.topic}</h1>
          <p className="text-zinc-500 text-sm mt-2">
            You argued <span className="text-red-400 font-medium">{session.userSide.toUpperCase()}</span>
          </p>
        </div>

        {loading && (
          <div className="text-center py-24 space-y-4">
            <div className="w-10 h-10 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 text-sm">Judge is deliberating...</p>
          </div>
        )}

        {verdict && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div ref={shareRef} className="space-y-4">

              {/* Winner hero */}
              <motion.div
                className={`relative overflow-hidden rounded-2xl border p-8 text-center ${
                  verdict.winner === "user"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className={`text-5xl font-black mb-3 ${
                  verdict.winner === "user" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {verdict.winner === "user" ? "You won" : "agAInst wins"}
                </div>
                <div className="text-3xl mb-4">
                  {verdict.winner === "user" ? "🏆" : "🤖"}
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                  {verdict.reasoning}
                </p>

                {/* Score totals */}
                <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-white/5">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${verdict.winner === "user" ? "text-emerald-400" : "text-zinc-400"}`}>
                      {userTotal}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Your score</div>
                  </div>
                  <div className="text-zinc-700 text-2xl font-light self-center">vs</div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${verdict.winner === "ai" ? "text-red-400" : "text-zinc-400"}`}>
                      {aiTotal}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">agAInst score</div>
                  </div>
                </div>
              </motion.div>

              {/* Score breakdown */}
              <motion.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {["user", "ai"].map(who => (
                  <div key={who} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                      {who === "user" ? "Your scores" : "agAInst scores"}
                    </p>
                    <div className="space-y-3">
                      {SCORE_LABELS.map((label, idx) => {
                        const scores = who === "user" ? verdict.user_scores : verdict.ai_scores
                        const val = scores[label]
                        return (
                          <div key={label}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                                <span>{SCORE_ICONS[label]}</span>{label}
                              </span>
                              <span className="text-xs font-medium text-zinc-300">{val}/10</span>
                            </div>
                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${who === "user" ? "bg-emerald-500" : "bg-red-500"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${val * 10}%` }}
                                transition={{ duration: 0.6, delay: 0.4 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Strongest argument */}
              <motion.div
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">
                  ⭐ Strongest argument
                </p>
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  &ldquo;{verdict.strongest_argument}&rdquo;
                </p>
              </motion.div>

              {/* Fallacies */}
              {verdict.fallacies.length > 0 && (
                <motion.div
                  className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-xs text-amber-600 uppercase tracking-widest mb-3">
                    ⚠️ Logical fallacies detected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {verdict.fallacies.map(f => (
                      <span key={f} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>

            {/* Action buttons */}
            <motion.div
              className="space-y-3 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button onClick={startSideFlip}
                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-red-500/40 text-zinc-300 hover:text-white rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2">
                🔄 Flip sides — argue the other position
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={shareDebate}
                  className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all text-sm font-medium">
                  📸 Save image
                </button>
                <button onClick={exportPDF}
                  className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all text-sm font-medium">
                  📄 Export PDF
                </button>
              </div>
              <button onClick={() => router.push("/")}
                className="w-full py-3.5 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 rounded-xl transition-all text-sm">
                ← Debate another topic
              </button>
            </motion.div>

          </motion.div>
        )}
      </div>
    </main>
  )
}