"use client"


import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getAllDebates } from "@/lib/cloudStorage"   // ← only change from original
import { DebateSession } from "@/lib/types"
import { useAuth } from "@/context/AuthContext"
import { UserMenu } from "@/components/UserMenu"
import Image from "next/image"

export default function HistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading, openAuthModal } = useAuth()
  const [debates, setDebates] = useState<DebateSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to resolve before fetching so we get the right source
    if (authLoading) return
    getAllDebates().then(d => {
      setDebates(d)
      setLoading(false)
    })
  }, [authLoading, user]) // re-fetch when user logs in/out

  const completed = debates.filter(d => d.status === "complete")
  const inProgress = debates.filter(d => d.status !== "complete")

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">

      {/* Nav — matches your existing nav exactly */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
          <Image src="/logo3.png" alt="agAInst logo" width={102} height={102} priority className="rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/leaderboard")}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-lg transition-all"
          >
            🏆 Leaderboard
          </button>
          <UserMenu />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Past Debates</h1>
            {user && (
              <p className="text-zinc-600 text-xs mt-1">☁️ Synced to cloud</p>
            )}
            {!user && !authLoading && (
              <button
                onClick={() => openAuthModal("signup")}
                className="text-xs text-zinc-500 hover:text-red-400 mt-1 transition-colors"
              >
                Sign in to sync across devices →
              </button>
            )}
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← New debate
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-[72px] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && debates.length === 0 && (
          <p className="text-zinc-500 text-sm">No debates yet. Start one!</p>
        )}

        {/* Completed debates */}
        {!loading && completed.length > 0 && (
          <div className="space-y-3">
            {completed.map((d, i) => (
              <DebateCard key={d.id} debate={d} index={i} onClick={() => router.push(`/verdict/${d.id}`)} />
            ))}
          </div>
        )}

        {/* In-progress debates */}
        {!loading && inProgress.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-600 uppercase tracking-widest">In progress</p>
            {inProgress.map((d, i) => (
              <DebateCard key={d.id} debate={d} index={i} onClick={() => router.push(`/debate/${d.id}`)} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function DebateCard({
  debate, index, onClick
}: {
  debate: DebateSession
  index: number
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-2 ${
        debate.status === "complete"
          ? "cursor-pointer hover:border-zinc-500"
          : "opacity-50 cursor-pointer hover:border-zinc-600"
      } transition-colors`}
    >
      <div className="flex items-center justify-between">
        <p className="text-white font-medium text-sm">{debate.topic}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          debate.status === "complete"
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-zinc-700 text-zinc-400 border-zinc-600"
        }`}>
          {debate.status === "complete" ? "Complete" : "In progress"}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span>You argued: <span className="text-zinc-300 uppercase">{debate.userSide}</span></span>
        <span>·</span>
        <span>{debate.rounds.length}/3 rounds</span>
        <span>·</span>
        <span>{new Date(debate.createdAt).toLocaleDateString()}</span>
      </div>
    </motion.div>
  )
}