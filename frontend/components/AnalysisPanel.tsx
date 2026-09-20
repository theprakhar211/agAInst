"use client"
import { motion } from "framer-motion"
import { ArgumentAnalysis } from "@/lib/types"

const TONE_COLORS = {
  logical: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  emotional: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  balanced: "text-green-400 bg-green-500/10 border-green-500/20",
}

export default function AnalysisPanel({ analysis, round }: {
  analysis: ArgumentAnalysis
  round: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.4 }}
      className="ml-auto max-w-lg"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl rounded-tr-sm px-4 py-3 space-y-3 mt-2">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">
          Round {round} analysis
        </p>

        {/* Score bars */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Claim strength", val: analysis.claim_strength },
            { label: "Evidence quality", val: analysis.evidence_quality },
          ].map(({ label, val }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>{label}</span>
                <span>{val}/10</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${val * 10}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tone badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Tone:</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${TONE_COLORS[analysis.emotional_vs_logical] ?? "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"}`}>
            {analysis.emotional_vs_logical}
          </span>
        </div>

        {/* Filler phrases */}
        {(analysis.filler_phrases?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">Weak phrases detected:</p>
            <div className="flex flex-wrap gap-1">
              {analysis.filler_phrases.map(f => (
                <span key={f} className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                  "{f}"
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="space-y-1.5 border-t border-zinc-800 pt-2">
          <p className="text-xs text-zinc-300 leading-relaxed">
            💡 {analysis.one_liner_feedback}
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            🎯 AI will likely target: {analysis.what_ai_noticed}
          </p>
        </div>
      </div>
    </motion.div>
  )
}