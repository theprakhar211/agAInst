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
  logic: "⚡", evidence: "📊", rebuttal: "🔄", clarity: "💡",
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
      if (!s || s.status !== "complete") { router.push("/"); return }
      setSession(s)

      const cached = getVerdict(id as string)
      if (cached) { setVerdict(cached); setLoading(false); return }

      const history = (s.rounds || []).flatMap(r => {
        const items: { role: "user" | "assistant"; content: string }[] = []
        if (r.userArgument) items.push({ role: "user", content: r.userArgument })
        if (r.aiArgument) items.push({ role: "assistant", content: r.aiArgument })
        return items
      })

      setApiError(null)
      judge({ topic: s.topic, user_side: s.userSide, history })
        .then(v => {
          if (v && (v.user_scores || v.winner)) { saveVerdict(id as string, v); setVerdict(v) }
          else throw new Error("Invalid verdict format returned from AI model.")
        })
        .catch(err => {
          console.error("Deliberation route failed:", err)
          setApiError("The evaluation AI experienced a temporary connection glitch or JSON timeout. Please try refreshing or click below to retry.")
        })
        .finally(() => setLoading(false))
    }
    load()
  }, [id, router])

  function retryJudge() {
    if (!session) return
    setLoading(true); setApiError(null)
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
    const canvas = await html2canvas(shareRef.current, { backgroundColor: "#080808", scale: 2 })
    const link = document.createElement("a")
    link.download = `agAInst-${session?.topic?.slice(0, 20)}.png`
    link.href = canvas.toDataURL(); link.click()
  }

  function startSideFlip() {
    if (!session) return
    const flipped = {
      id: crypto.randomUUID(), topic: session.topic,
      userSide: (session.userSide === "for" ? "against" : "for") as "for" | "against",
      rounds: [], status: "debating" as const, createdAt: Date.now(), aiGoesFirst: Math.random() < 0.5,
    }
    saveDebate(flipped); router.push(`/debate/${flipped.id}`)
  }

  function exportPDF() {
    if (!session || !verdict) return
    const doc = new jsPDF(); let y = 20
    const line = (text: string, size = 11, bold = false) => {
      doc.setFontSize(size); doc.setFont("helvetica", bold ? "bold" : "normal")
      const lines = doc.splitTextToSize(text, 170)
      lines.forEach((l: string) => { if (y > 270) { doc.addPage(); y = 20 }; doc.text(l, 20, y); y += 8 }); y += 2
    }
    line("agAInst — Debate Transcript", 18, true)
    line(`Topic: ${session.topic}`, 13, true)
    line(`Your side: ${session.userSide.toUpperCase()}`)
    line(`Date: ${new Date(session.createdAt).toLocaleDateString()}`)
    y += 4
    session.rounds.forEach(r => {
      line(`Round ${r.number} — ${["Opening","Rebuttal","Closing"][r.number-1]}`, 13, true)
      line(`You: ${r.userArgument}`, 10); y += 2
      line(`agAInst: ${r.aiArgument}`, 10); y += 4
    })
    y += 4; line("Verdict", 14, true)
    line(`Winner: ${verdict.winner === "user" ? "You" : "agAInst"}`, 12, true)
    line(`Reasoning: ${verdict.reasoning}`, 10)
    SCORE_LABELS.forEach(l => { line(`${l}: You ${(verdict.user_scores?.[l]) ?? 0}/10 vs agAInst ${(verdict.ai_scores?.[l]) ?? 0}/10`, 10) })
    if (verdict.strongest_argument) line(`Strongest: "${verdict.strongest_argument}"`, 10)
    doc.save(`agAInst-${session.topic.slice(0, 30)}.pdf`)
  }

  if (!session) return null

  const userTotal = verdict?.user_scores ? SCORE_LABELS.reduce((s, l) => s + (verdict.user_scores[l] || 0), 0) : 0
  const aiTotal = verdict?.ai_scores ? SCORE_LABELS.reduce((s, l) => s + (verdict.ai_scores[l] || 0), 0) : 0
  const userWon = verdict?.winner === "user"

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">

      {/* ─── BG TEXTURE ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-600/8 blur-[140px] rounded-full" />
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

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-32 pb-24">

        {/* ─── Topic badge ─── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 mb-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">VS AI · Verdict</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">{session.topic}</h1>
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
            You argued <span className={`font-bold ${session.userSide === "for" ? "text-emerald-500" : "text-red-500"}`}>{session.userSide}</span>
          </p>
        </div>

        {/* ─── Loading ─── */}
        {loading && (
          <div className="text-center py-24 space-y-4">
            <div className="relative w-14 h-14 mx-auto">
              <div className="absolute inset-0 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-zinc-800 border-b-zinc-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
            </div>
            <p className="text-zinc-600 text-[11px] font-mono uppercase tracking-[0.3em]">Judge deliberating...</p>
          </div>
        )}

        {/* ─── Error ─── */}
        {apiError && !loading && (
          <div className="border border-red-500/20 bg-red-500/5 p-6 text-center space-y-4 my-12 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500/40" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500/40" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500/40" />
            <p className="text-xs font-mono uppercase tracking-widest text-red-500">⚠ System Error</p>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">{apiError}</p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={retryJudge}
                className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-mono uppercase tracking-widest text-white transition-all">
                🔄 Retry
              </button>
              <button onClick={() => router.push("/")}
                className="px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-all">
                Return Home
              </button>
            </div>
          </div>
        )}

        {/* ─── Verdict content ─── */}
        {verdict && !apiError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div ref={shareRef} className="space-y-3">

              {/* Winner hero */}
              <motion.div
                className="relative overflow-hidden border p-8 text-center"
                style={{
                  background: userWon
                    ? "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 60%)"
                    : "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 60%)",
                  borderColor: userWon ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                }}
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {/* Corner accents */}
                <div className={`absolute top-0 left-0 w-5 h-5 border-t border-l ${userWon ? "border-emerald-500/40" : "border-red-500/40"}`} />
                <div className={`absolute top-0 right-0 w-5 h-5 border-t border-r ${userWon ? "border-emerald-500/40" : "border-red-500/40"}`} />
                <div className={`absolute bottom-0 left-0 w-5 h-5 border-b border-l ${userWon ? "border-emerald-500/40" : "border-red-500/40"}`} />
                <div className={`absolute bottom-0 right-0 w-5 h-5 border-b border-r ${userWon ? "border-emerald-500/40" : "border-red-500/40"}`} />

                {/* Result label */}
                <div className="inline-block border px-3 py-1 mb-6"
                  style={{ borderColor: userWon ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)" }}>
                  <span className={`text-[10px] font-mono uppercase tracking-[0.3em] ${userWon ? "text-emerald-500" : "text-red-500"}`}>
                    {userWon ? "Victory" : "Defeat"}
                  </span>
                </div>

                <div className={`text-6xl font-black uppercase tracking-tighter mb-2 ${userWon ? "text-emerald-400" : "text-red-400"}`}
                  style={{ textShadow: userWon ? "0 0 40px rgba(16,185,129,0.3)" : "0 0 40px rgba(239,68,68,0.3)" }}>
                  {userWon ? "You won" : "AI wins"}
                </div>
                <div className="text-3xl mb-5">{userWon ? "🏆" : "🤖"}</div>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">{verdict.reasoning}</p>

                {/* Score totals */}
                <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-zinc-900">
                  {[
                    { label: "You", score: userTotal, highlight: userWon, color: "emerald" },
                    { label: "agAInst", score: aiTotal, highlight: !userWon, color: "red" },
                  ].map((side, i) => (
                    <div key={i} className="text-center">
                      <div className={`text-3xl font-black mb-1 ${side.highlight
                        ? side.color === "emerald" ? "text-emerald-400" : "text-red-400"
                        : "text-zinc-600"}`}>
                        {side.score}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">{side.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Score breakdown */}
              <motion.div className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                {(["user", "ai"] as const).map(who => {
                  const scores = who === "user" ? verdict.user_scores : verdict.ai_scores
                  const isWinner = verdict.winner === who
                  const accentColor = who === "user" ? "bg-emerald-500" : "bg-red-500"
                  return (
                    <div key={who} className="bg-zinc-900/40 border border-zinc-800 p-5 relative">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                          {who === "user" ? "Your scores" : "agAInst"}
                        </p>
                        {isWinner && (
                          <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="space-y-3.5">
                        {SCORE_LABELS.map((label, idx) => {
                          const val = scores ? (scores[label] ?? 0) : 0
                          return (
                            <div key={label}>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                                  {SCORE_ICONS[label]} {label}
                                </span>
                                <span className="text-xs font-black text-zinc-300 font-mono">{val}<span className="text-zinc-700">/10</span></span>
                              </div>
                              <div className="h-px bg-zinc-800 overflow-hidden">
                                <motion.div
                                  className={`h-full ${accentColor}`}
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
                  )
                })}
              </motion.div>

              {/* Strongest argument */}
              {verdict.strongest_argument && (
                <motion.div className="border border-zinc-800 bg-zinc-900/30 p-5 relative"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3">⭐ Strongest argument</p>
                  <p className="text-zinc-300 text-sm leading-relaxed font-light italic">&ldquo;{verdict.strongest_argument}&rdquo;</p>
                </motion.div>
              )}

              {/* Fallacies */}
              {verdict.fallacies && verdict.fallacies.length > 0 && (
                <motion.div className="border border-amber-500/15 bg-amber-500/5 p-5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-600 mb-3">⚠ Logical fallacies detected</p>
                  <div className="flex flex-wrap gap-2">
                    {verdict.fallacies.map(f => (
                      <span key={f} className="text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1">
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>

            {/* ─── Actions ─── */}
            <motion.div className="space-y-2 mt-6"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <button onClick={startSideFlip}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.99] flex items-center justify-center gap-2">
                🔄 Flip sides — argue the other position
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={shareDebate}
                  className="py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all text-xs font-mono uppercase tracking-widest">
                  📸 Save image
                </button>
                <button onClick={exportPDF}
                  className="py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all text-xs font-mono uppercase tracking-widest">
                  📄 Export PDF
                </button>
              </div>
              <button onClick={() => router.push("/")}
                className="w-full py-3.5 border border-zinc-800 hover:border-zinc-600 text-zinc-600 hover:text-zinc-400 transition-all text-xs font-mono uppercase tracking-widest">
                ← Debate another topic
              </button>
            </motion.div>

          </motion.div>
        )}
      </div>
    </main>
  )
}