"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getAllDebates, getAllPvPSessions } from "@/lib/cloudStorage"
import { DebateSession, PvPSession } from "@/lib/types"
import { useAuth } from "@/context/AuthContext"
import { UserMenu } from "@/components/UserMenu"
import Image from "next/image"

type Tab = "all" | "vs-ai" | "pvp"

export default function HistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading, openAuthModal } = useAuth()
  const [debates, setDebates] = useState<DebateSession[]>([])
  const [pvpSessions, setPvpSessions] = useState<PvPSession[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")

  useEffect(() => {
    if (authLoading) return
    Promise.all([getAllDebates(), getAllPvPSessions()]).then(([d, p]) => {
      setDebates(d)
      setPvpSessions(p)
      setLoading(false)
    })
  }, [authLoading, user])

  // Combined + sorted by date for "all" tab
  type AnySession = { id: string; createdAt: number; type: "ai" | "pvp" }
  const allSorted: AnySession[] = [
    ...debates.map(d => ({ id: d.id, createdAt: d.createdAt, type: "ai" as const })),
    ...pvpSessions.map(p => ({ id: p.id, createdAt: p.createdAt, type: "pvp" as const })),
  ].sort((a, b) => b.createdAt - a.createdAt)

  const debateMap = Object.fromEntries(debates.map(d => [d.id, d]))
  const pvpMap = Object.fromEntries(pvpSessions.map(p => [p.id, p]))

  const totalCount = debates.length + pvpSessions.length

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">

      {/* Nav */}
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

        {/* Header */}
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

        {/* Tabs — only show if there's something to filter */}
        {!loading && totalCount > 0 && (
          <div className="flex gap-2">
            {(["all", "vs-ai", "pvp"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  tab === t
                    ? "bg-zinc-800 border-zinc-600 text-white"
                    : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {t === "all" ? `All (${totalCount})` : t === "vs-ai" ? `🤖 VS AI (${debates.length})` : `👥 2 Player (${pvpSessions.length})`}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-[72px] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && totalCount === 0 && (
          <p className="text-zinc-500 text-sm">No debates yet. Start one!</p>
        )}

        {/* All tab — chronological mix */}
        {!loading && tab === "all" && allSorted.map((s, i) =>
          s.type === "ai" ? (
            <AICard
              key={s.id}
              debate={debateMap[s.id]}
              index={i}
              onClick={() => debateMap[s.id].status === "complete"
                ? router.push(`/verdict/${s.id}`)
                : router.push(`/debate/${s.id}`)
              }
            />
          ) : (
            <PvPCard
              key={s.id}
              session={pvpMap[s.id]}
              index={i}
              onClick={() => pvpMap[s.id].status === "complete"
                ? router.push(`/pvp/verdict/${s.id}`)
                : router.push(`/pvp/${s.id}`)
              }
            />
          )
        )}

        {/* VS AI tab */}
        {!loading && tab === "vs-ai" && debates.length === 0 && (
          <p className="text-zinc-500 text-sm">No VS AI debates yet.</p>
        )}
        {!loading && tab === "vs-ai" && debates.map((d, i) => (
          <AICard
            key={d.id}
            debate={d}
            index={i}
            onClick={() => d.status === "complete"
              ? router.push(`/verdict/${d.id}`)
              : router.push(`/debate/${d.id}`)
            }
          />
        ))}

        {/* PvP tab */}
        {!loading && tab === "pvp" && pvpSessions.length === 0 && (
          <p className="text-zinc-500 text-sm">No 2 Player debates yet.</p>
        )}
        {!loading && tab === "pvp" && pvpSessions.map((p, i) => (
          <PvPCard
            key={p.id}
            session={p}
            index={i}
            onClick={() => p.status === "complete"
              ? router.push(`/pvp/verdict/${p.id}`)
              : router.push(`/pvp/${p.id}`)
            }
          />
        ))}

      </div>
    </main>
  )
}

// ─── VS AI card ───────────────────────────────────────────────

function AICard({ debate, index, onClick }: {
  debate: DebateSession
  index: number
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-2 cursor-pointer transition-colors ${
        debate.status === "complete" ? "hover:border-zinc-500" : "opacity-50 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-white font-medium text-sm truncate">{debate.topic}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded-full">🤖 VS AI</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            debate.status === "complete"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-zinc-700 text-zinc-400 border-zinc-600"
          }`}>
            {debate.status === "complete" ? "Complete" : "In progress"}
          </span>
        </div>
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

// ─── PvP card ─────────────────────────────────────────────────

function PvPCard({ session, index, onClick }: {
  session: PvPSession
  index: number
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-2 cursor-pointer transition-colors ${
        session.status === "complete" ? "hover:border-zinc-500" : "opacity-50 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-white font-medium text-sm truncate">{session.topic}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded-full">👥 2 Player</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            session.status === "complete"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-zinc-700 text-zinc-400 border-zinc-600"
          }`}>
            {session.status === "complete" ? "Complete" : "In progress"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="text-red-400">{session.player1Name}</span>
        <span className="text-zinc-600">FOR</span>
        <span className="text-zinc-700">vs</span>
        <span className="text-blue-400">{session.player2Name}</span>
        <span className="text-zinc-600">AGAINST</span>
        <span>·</span>
        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
      </div>
    </motion.div>
  )
}