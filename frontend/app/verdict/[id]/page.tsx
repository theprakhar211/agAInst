// frontend/app/verdict/[id]/page.tsx
"use client"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import html2canvas from "html2canvas"
import { judge } from "@/lib/api"
import { DebateSession } from "@/lib/types"
import { getDebate, saveDebate, getVerdict, saveVerdict } from "@/lib/storage"
import jsPDF from "jspdf"

interface Verdict {
  winner: "user" | "ai"
  user_scores: Record<string, number>
  ai_scores: Record<string, number>
  strongest_argument: string
  reasoning: string
  fallacies: string[]
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
    if (cached) {
      setVerdict(cached)
      setLoading(false)
      return
    }

    const history = s.rounds.flatMap(r => [
      { role: "user" as const, content: r.userArgument },
      { role: "assistant" as const, content: r.aiArgument },
    ])

    judge({ topic: s.topic, user_side: s.userSide, history })
      .then(v => {
        saveVerdict(id as string, v)
        setVerdict(v)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function shareDebate() {
    if (!shareRef.current) return
    const canvas = await html2canvas(shareRef.current, {
      backgroundColor: "#18181b",
      scale: 2,
    })
    const link = document.createElement("a")
    link.download = `agAInst-${session?.topic?.slice(0, 20)}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  function exportPDF() {
  if (!session || !verdict) return
  const doc = new jsPDF()
  
  const lineHeight = 8
  let y = 20

  const addLine = (text: string, size = 11, bold = false) => {
    doc.setFontSize(size)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    const lines = doc.splitTextToSize(text, 170)
    lines.forEach((line: string) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(line, 20, y)
      y += lineHeight
    })
    y += 2
  }

 // Header
  addLine("agAInst — Debate Transcript", 18, true)
  addLine(`Topic: ${session.topic}`, 13, true)
  addLine(`Your side: ${session.userSide.toUpperCase()}`, 11)
  addLine(`Date: ${new Date(session.createdAt).toLocaleDateString()}`, 11)
  y += 4

  // Rounds
  const roundNames = ["Opening", "Rebuttal", "Closing"]
  session.rounds.forEach((round) => {
    addLine(`Round ${round.number} — ${roundNames[round.number - 1]}`, 13, true)
    addLine(`You: ${round.userArgument}`, 10)
    y += 2
    addLine(`agAInst: ${round.aiArgument}`, 10)
    y += 4
  })

  // Verdict
  y += 4
  addLine("Verdict", 14, true)
  addLine(`Winner: ${verdict.winner === "user" ? "You" : "agAInst"}`, 12, true)
  addLine(`Reasoning: ${verdict.reasoning}`, 10)
  y += 2
  addLine("Scores:", 11, true)
  const labels = ["logic", "evidence", "rebuttal", "clarity"]
  labels.forEach(label => {
    addLine(`  ${label}: You ${verdict.user_scores[label]}/10 vs agAInst ${verdict.ai_scores[label]}/10`, 10)
  })
  if (verdict.strongest_argument) {
    y += 2
    addLine(`Strongest argument: "${verdict.strongest_argument}"`, 10)
  }
  if (verdict.fallacies.length > 0) {
    y += 2
    addLine(`Fallacies detected: ${verdict.fallacies.join(", ")}`, 10)
  }

  doc.save(`agAInst-${session.topic.slice(0, 30)}.pdf`)
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
    aiGoesFirst: Math.random() < 0.5,   // add this line
  }
  saveDebate(flipped)
  router.push(`/debate/${flipped.id}`)
}

  if (!session) return null

  const SCORE_LABELS = ["logic", "evidence", "rebuttal", "clarity"]

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-10">

        <div className="text-center">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Verdict</p>
          <h1 className="text-3xl font-bold">{session.topic}</h1>
        </div>

        {loading && (
          <div className="text-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-400">Judge is deliberating...</p>
          </div>
        )}

        {verdict && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Share card wrapper — everything inside gets captured */}
            <div ref={shareRef} className="space-y-6 bg-black p-2 rounded-2xl">

              {/* Winner */}
              <motion.div
                className="text-center py-8 bg-zinc-900 border border-zinc-700 rounded-2xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <p className="text-zinc-400 text-sm mb-2">Winner</p>
                <p className={`text-4xl font-bold ${verdict.winner === "user" ? "text-green-400" : "text-red-400"}`}>
                  {verdict.winner === "user" ? "You won 🏆" : "agAInst wins 🤖"}
                </p>
                <p className="text-zinc-400 text-sm mt-4 max-w-md mx-auto leading-relaxed px-4">
                  {verdict.reasoning}
                </p>
              </motion.div>

              {/* Scores */}
              <motion.div
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {["user", "ai"].map(who => (
                  <div key={who} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-3">
                    <p className="text-sm font-medium text-zinc-300">
                      {who === "user" ? "Your scores" : "agAInst scores"}
                    </p>
                    {SCORE_LABELS.map(label => {
                      const scores = who === "user" ? verdict.user_scores : verdict.ai_scores
                      const val = scores[label]
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-zinc-400 mb-1 capitalize">
                            <span>{label}</span><span>{val}/10</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-red-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${val * 10}%` }}
                              transition={{ duration: 0.6, delay: 0.5 }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </motion.div>

              {/* Strongest argument */}
              <motion.div
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Strongest argument</p>
                <p className="text-zinc-300 text-sm leading-relaxed italic">"{verdict.strongest_argument}"</p>
              </motion.div>

              {/* Fallacies */}
              {verdict.fallacies.length > 0 && (
                <motion.div
                  className="bg-zinc-900 border border-zinc-700 rounded-xl p-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Logical fallacies detected</p>
                  <div className="flex flex-wrap gap-2">
                    {verdict.fallacies.map(f => (
                      <span key={f} className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
            {/* End share card wrapper */}

            {/* Buttons — outside share ref so they don't appear in the image */}
            <button
              onClick={shareDebate}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors text-sm font-medium"
            >
              Download Result Card
            </button>

            <button
              onClick={exportPDF}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors text-sm font-medium"
            >
              Export as PDF
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full py-4 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-xl transition-colors text-sm font-medium"
            >
              Debate another topic
            </button>

            <button
  onClick={startSideFlip}
  className="w-full py-4 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-400 rounded-xl transition-colors text-sm font-medium"
>
  🔄 Flip sides — argue the other position
</button>
          </motion.div>
        )}
      </div>
    </main>
  )
}