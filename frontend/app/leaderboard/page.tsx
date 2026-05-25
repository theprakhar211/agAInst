"use client"
// frontend/app/leaderboard/page.tsx

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { UserMenu } from "@/components/UserMenu"
import { getLeaderboard, getMyRank, type SortBy, type LeaderboardEntry } from "@/lib/leaderboard"

const TABS: { key: SortBy; label: string; icon: string; description: string }[] = [
  { key: "win_rate",   label: "Win Rate",    icon: "🎯", description: "% of debates won" },
  { key: "total_wins", label: "Total Wins",  icon: "🏆", description: "Raw wins count" },
  { key: "avg_score",  label: "Avg Score",   icon: "⭐", description: "Mean judge score" },
]

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

function formatValue(entry: LeaderboardEntry, sortBy: SortBy): string {
  if (sortBy === "win_rate")   return `${entry.win_rate}%`
  if (sortBy === "total_wins") return `${entry.total_wins} W`
  return `${entry.avg_score}/40`
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<SortBy>("win_rate")
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<{ rank: number; entry: LeaderboardEntry } | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated] = useState(() => new Date().toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  }))

  const fetchData = useCallback(async (tab: SortBy) => {
    setLoading(true)
    const [board, rank] = await Promise.all([
      getLeaderboard(tab),
      user ? getMyRank(user.id, tab) : Promise.resolve(null),
    ])
    setEntries(board)
    setMyRank(rank)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    fetchData(activeTab)
  }, [activeTab, authLoading, fetchData])

  const myEntry = myRank?.entry
  const isInTop100 = myEntry ? myEntry.rank <= 100 : false

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
          <Image src="/logo3.png" alt="agAInst logo" width={102} height={102} priority className="rounded-lg" />
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

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Leaderboard</h1>
              <p className="text-zinc-600 text-xs">Top 100 debaters · Updated {lastUpdated}</p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ← New debate
            </button>
          </div>
        </motion.div>

        {/* Your rank card — shown when logged in */}
        {user && myEntry && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-4"
          >
            <div className="text-2xl font-black text-red-400 w-10 text-center flex-shrink-0">
              #{myEntry.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">Your ranking</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {myEntry.total_debates} debates · {myEntry.total_wins} wins · {myEntry.win_rate}% win rate · {myEntry.avg_score}/40 avg
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-white font-bold text-lg">{formatValue(myEntry, activeTab)}</div>
              {!isInTop100 && (
                <div className="text-zinc-600 text-xs mt-0.5">Outside top 100</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Guest nudge */}
        {!user && !authLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center"
          >
            <p className="text-zinc-400 text-sm">
              <button
                onClick={() => router.push("/")}
                className="text-red-400 hover:text-red-300 transition-colors font-medium"
              >
                Sign in
              </button>
              {" "}to see your ranking
            </p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                activeTab === tab.key
                  ? "bg-zinc-800 border-zinc-600 text-white"
                  : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab description */}
        <p className="text-zinc-600 text-xs mb-4 uppercase tracking-widest">
          {TABS.find(t => t.key === activeTab)?.description} · minimum 3 debates to qualify
        </p>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 0.04}s` }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⚔️</div>
            <p className="text-zinc-400 font-semibold mb-2">No rankings yet</p>
            <p className="text-zinc-600 text-sm">Complete 3 debates to appear on the leaderboard.</p>
          </div>
        )}

        {/* Leaderboard rows */}
        {!loading && entries.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {/* Top 3 podium */}
              {entries.slice(0, 3).map((entry, i) => (
                <TopRow
                  key={entry.user_id}
                  entry={entry}
                  sortBy={activeTab}
                  isMe={user?.id === entry.user_id}
                  index={i}
                />
              ))}

              {/* Divider */}
              {entries.length > 3 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-zinc-700 text-xs">Top 100</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
              )}

              {/* Rest */}
              {entries.slice(3).map((entry, i) => (
                <Row
                  key={entry.user_id}
                  entry={entry}
                  sortBy={activeTab}
                  isMe={user?.id === entry.user_id}
                  index={i + 3}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  )
}

// ─── Top 3 row (larger, with medal) ─────────────────────────

function TopRow({ entry, sortBy, isMe, index }: {
  entry: LeaderboardEntry
  sortBy: SortBy
  isMe: boolean
  index: number
}) {
  const initials = (entry.username ?? "?").slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
        isMe
          ? "bg-red-500/5 border-red-500/25"
          : "bg-zinc-900/60 border-zinc-700/60"
      }`}
    >
      {/* Medal */}
      <div className="text-2xl w-8 text-center flex-shrink-0">
        {MEDAL[entry.rank]}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-red-500/80 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
          : initials
        }
      </div>

      {/* Name + stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm truncate ${isMe ? "text-red-300" : "text-white"}`}>
            {entry.username}
          </p>
          {isMe && <span className="text-[10px] text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full flex-shrink-0">you</span>}
        </div>
        <p className="text-zinc-500 text-xs mt-0.5">
          {entry.total_debates} debates · {entry.total_wins} wins
        </p>
      </div>

      {/* Primary stat */}
      <div className="text-right flex-shrink-0">
        <div className={`text-lg font-bold ${isMe ? "text-red-400" : "text-white"}`}>
          {formatValue(entry, sortBy)}
        </div>
        <div className="text-zinc-600 text-xs">{entry.avg_score}/40 avg</div>
      </div>
    </motion.div>
  )
}

// ─── Regular row ─────────────────────────────────────────────

function Row({ entry, sortBy, isMe, index }: {
  entry: LeaderboardEntry
  sortBy: SortBy
  isMe: boolean
  index: number
}) {
  const initials = (entry.username ?? "?").slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4) }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
        isMe
          ? "bg-red-500/5 border-red-500/20"
          : "bg-zinc-900/30 border-zinc-800/60 hover:border-zinc-700"
      }`}
    >
      {/* Rank */}
      <div className="text-xs text-zinc-600 w-7 text-right flex-shrink-0 font-mono">
        {entry.rank}
      </div>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0 overflow-hidden">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
          : initials
        }
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className={`text-sm truncate ${isMe ? "text-red-300 font-medium" : "text-zinc-300"}`}>
          {entry.username}
        </p>
        {isMe && <span className="text-[10px] text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full flex-shrink-0">you</span>}
      </div>

      {/* Secondary stats */}
      <div className="text-zinc-600 text-xs flex-shrink-0 hidden sm:block">
        {entry.total_debates}d · {entry.total_wins}w
      </div>

      {/* Primary stat */}
      <div className={`text-sm font-semibold w-16 text-right flex-shrink-0 ${isMe ? "text-red-400" : "text-zinc-300"}`}>
        {formatValue(entry, sortBy)}
      </div>
    </motion.div>
  )
}
