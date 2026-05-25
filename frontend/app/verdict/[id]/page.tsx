"use client"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { judge } from "@/lib/api"
import { DebateSession } from "@/lib/types"
import { getDebate, getVerdict, saveVerdict, saveDebate } from "@/lib/cloudStorage"
import { UserMenu } from "@/components/UserMenu"
import Image from "next/image"

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
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const s = await getDebate(id as string)
      if (!s || s.status !== "complete") {
        router.push("/")
        return
      }
      setSession(s)

      const cached = getVerdict(id as string)
      if (cached) {
        setVerdict(cached)
        setLoading(false)
        return
      }

      // Explicit structural mapping over s.rounds to build the chat payload clean
      const history = (s.rounds || []).flatMap(r => {
        const items: { role: "user" | "assistant"; content: string }[] = []
        if (r.userArgument) items.push({ role: "user", content: r.userArgument })
        if (r.aiArgument) items.push({ role: "assistant", content: r.aiArgument })
        return items
      })

      setApiError(null)
      judge({ topic: s.topic, user_side: s.userSide, history })
        .then(v => {
          if (v && (v.user_scores || v.winner)) {
            saveVerdict(id as string, v)
            setVerdict(v)
          } else {
            throw new Error("Invalid verdict format returned from AI model.")
          }
        })
        .catch(err => {
          console.error("Deliberation route failed:", err)
          setApiError("The evaluation AI experienced a temporary connection glitch or JSON timeout. Please try refreshing or click below to retry.")
        })
        .finally(() => setLoading(false))
    }
    load()
  }, [id, router])

  // Explicit retry helper so users don't get permanently stuck if the backend AI fails
  function retryJudge() {
    if (!session) return
    setLoading(true)
    setApiError(null)
    const history = (session.rounds || []).flatMap(r => [
      { role: "user" as const, content: r.userArgument },
      { role: "assistant" as const, content: r.aiArgument },
    ])
    judge({ topic: session.topic, user_side: session.userSide, history })
      .then(v => { saveVerdict(id as string, v); setVerdict(v) })
      .catch(() => setApiError("The evaluation AI experienced a temporary connection glitch or JSON timeout. Please try refreshing or click below to retry."))
      .finally(() => setLoading(false))
  }

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
      line(`${l}: You ${(verdict.user_scores?.[l]) ?? 0}/10 vs agAInst ${(verdict.ai_scores?.[l]) ?? 0}/10`, 10)
    })
    if (verdict.strongest_argument) line(`Strongest: "${verdict.strongest_argument}"`, 10)
    doc.save(`agAInst-${session.topic.slice(0, 30)}.pdf`)
  }

  if (!session) return null

  // Hardened fallback parameters checking to avoid reducer errors on broken inputs
  const userTotal = verdict && verdict.user_scores ? SCORE_LABELS.reduce((s, l) => s + (verdict.user_scores[l] || 0), 0) : 0
  const aiTotal = verdict && verdict.ai_scores ? SCORE_LABELS.reduce((s, l) => s + (verdict.ai_scores[l] || 0), 0) : 0

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
          <Image
            src="/logo3.png"
            alt="agAInst logo"
            width={102}
            height={102}
            priority
            className="rounded-lg"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/history")}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-all"
          >
            📚 Past debates
          </button>
          <UserMenu />
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-24">

        {/* Topic header */}
        <div className="text-center mb-10 select-none">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Verdict</p>
          <h1 className="text-xl font-bold text-white">{session.topic}</h1>
          <p className="text-xs text-zinc-600 mt-2">
            You argued <span className="text-zinc-400 uppercase">{session.userSide}</span>
          </p>
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 text-sm">Judge is deliberating...</p>
          </div>
        )}

        {/* Safety Error Card UI fallback if backend Python API route crashes */}
        {apiError && !loading && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center space-y-4 my-12">
            <div className="text-2xl">⚠️</div>
            <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
              {apiError}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={retryJudge} className="px-5 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-medium rounded-lg transition-all text-white">
                🔄 Retry Evaluation
              </button>
              <button onClick={() => router.push("/")} className="px-5 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-all">
                Return Home
              </button>
            </div>
          </div>
        )}

        {verdict && !apiError && (
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
                        const val = scores ? (scores[label] ?? 0) : 0
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
              {verdict.strongest_argument && (
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
              )}

              {/* Fallacies */}
              {verdict.fallacies && verdict.fallacies.length > 0 && (
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