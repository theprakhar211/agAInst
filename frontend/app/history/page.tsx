// frontend/app/history/page.tsx
"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAllDebates } from "@/lib/storage"
import { DebateSession } from "@/lib/types"
import { motion } from "framer-motion"

export default function HistoryPage() {
  const router = useRouter()
  const [debates, setDebates] = useState<DebateSession[]>([])

  useEffect(() => {
    setDebates(getAllDebates())
  }, [])

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Past Debates</h1>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← New debate
          </button>
        </div>

        {debates.length === 0 && (
          <p className="text-zinc-500 text-sm">No debates yet. Start one!</p>
        )}

        {debates.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => d.status === "complete" && router.push(`/verdict/${d.id}`)}
            className={`bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-2 ${
              d.status === "complete" ? "cursor-pointer hover:border-zinc-500" : "opacity-50"
            } transition-colors`}
          >
            <div className="flex items-center justify-between">
              <p className="text-white font-medium text-sm">{d.topic}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                d.status === "complete"
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-zinc-700 text-zinc-400 border-zinc-600"
              }`}>
                {d.status === "complete" ? "Complete" : "In progress"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>You argued: <span className="text-zinc-300 uppercase">{d.userSide}</span></span>
              <span>·</span>
              <span>{d.rounds.length}/3 rounds</span>
              <span>·</span>
              <span>{new Date(d.createdAt).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  )
}