"use client"
// frontend/app/leaderboard/page.tsx

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { UserMenu } from "@/components/UserMenu"
import { getLeaderboard, getMyRank, type SortBy, type LeaderboardEntry } from "@/lib/leaderboard"

const TABS: { key: SortBy; label: string; description: string }[] = [
  { key: "win_rate",   label: "Win Rate",   description: "% of debates won" },
  { key: "total_wins", label: "Total Wins", description: "Raw wins count" },
  { key: "avg_score",  label: "Avg Score",  description: "Mean judge score" },
]

const RANK_COLORS: Record<number, { text: string; border: string; bg: string; glow: string }> = {
  1: { text: "text-amber-400",   border: "border-amber-400/30",  bg: "bg-amber-400/5",   glow: "0 0 20px rgba(251,191,36,0.15)" },
  2: { text: "text-zinc-300",    border: "border-zinc-400/20",   bg: "bg-zinc-400/5",    glow: "none" },
  3: { text: "text-orange-400",  border: "border-orange-400/20", bg: "bg-orange-400/5",  glow: "none" },
}

const RANK_LABELS: Record<number, string> = { 1: "01", 2: "02", 3: "03" }

function formatValue(entry: LeaderboardEntry, sortBy: SortBy): string {
  if (sortBy === "win_rate")   return `${entry.win_rate}%`
  if (sortBy === "total_wins") return `${entry.total_wins}`
  return `${entry.avg_score}`
}

function formatValueUnit(sortBy: SortBy): string {
  if (sortBy === "win_rate")   return "win rate"
  if (sortBy === "total_wins") return "wins"
  return "/ 40 avg"
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<SortBy>("win_rate")
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<{ rank: number; entry: LeaderboardEntry } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)

  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const fetchData = useCallback(async (tab: SortBy, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    const [board, rank] = await Promise.all([
      getLeaderboard(tab),
      user ? getMyRank(user.id, tab) : Promise.resolve(null),
    ])
    setEntries(board)
    setMyRank(rank)
    setLastFetchedAt(new Date())
    if (isRefresh) setRefreshing(false)
    else setLoading(false)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    fetchData(activeTab, false)
  }, [activeTab, authLoading, fetchData])

  const myEntry = myRank?.entry
  const isInTop100 = myEntry ? myEntry.rank <= 100 : false

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-red-500/30 selection:text-red-200">

      {/* ─── BG TEXTURE ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/8 blur-[140px] rounded-full" />
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

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-28 pb-24">

        {/* ─── PAGE HEADER ─── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 mb-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Global Rankings</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Leaderboard</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-700 mt-1.5">
                Top 100 operators · {lastFetchedAt ? `Updated ${getTimeAgo(lastFetchedAt)}` : "Loading..."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData(activeTab, true)}
                disabled={refreshing || loading}
                className="text-[11px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 transition-all disabled:opacity-30 flex items-center gap-1.5"
              >
                {refreshing
                  ? <><div className="w-2.5 h-2.5 border border-zinc-600 border-t-zinc-300 rounded-full animate-spin" /> Refreshing</>
                  : "↻ Refresh"
                }
              </button>
              <button onClick={() => router.push("/")}
                className="text-[11px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">
                ← Arena
              </button>
            </div>
          </div>
        </motion.div>

        {/* ─── YOUR RANK CARD ─── */}
        {user && myEntry && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-4 border border-red-500/20 bg-red-500/5 p-5 relative"
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500/30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500/30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-500/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500/30" />

            <div className="flex items-center gap-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-500 flex-shrink-0 w-10 text-center">
                <div className="text-2xl font-black text-red-400 leading-none">#{myEntry.rank}</div>
                <div className="mt-0.5">Rank</div>
              </div>
              <div className="w-px h-10 bg-red-500/20 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-red-500/70 mb-0.5">Your standing</p>
                <p className="text-zinc-400 text-xs font-mono">
                  {myEntry.total_debates} debates · {myEntry.total_wins} wins · {myEntry.win_rate}% WR · {myEntry.avg_score}/40 avg
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-black text-red-400 font-mono">{formatValue(myEntry, activeTab)}</div>
                <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">{formatValueUnit(activeTab)}</div>
                {!isInTop100 && (
                  <div className="text-[10px] font-mono text-zinc-700 mt-0.5">Outside top 100</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── GUEST NUDGE ─── */}
        {!user && !authLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 border border-zinc-800 bg-zinc-900/40 p-4 text-center relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />
            <p className="text-zinc-500 text-xs font-mono">
              <button onClick={() => router.push("/")}
                className="text-red-500 hover:text-red-400 transition-colors font-bold uppercase tracking-widest">
                Sign in
              </button>
              <span className="ml-2">to see your ranking</span>
            </p>
          </motion.div>
        )}

        {/* ─── TABS ─── */}
        <div className="flex gap-0 mb-2 border border-zinc-800">
          {TABS.map((tab, i) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-[11px] font-mono uppercase tracking-widest transition-all relative ${
                activeTab === tab.key
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30"
              } ${i < TABS.length - 1 ? "border-r border-zinc-800" : ""}`}>
              {activeTab === tab.key && (
                <motion.div layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-px bg-red-600" />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab description */}
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-700 mb-6">
          {TABS.find(t => t.key === activeTab)?.description} · min. 3 debates to qualify
        </p>

        {/* ─── LOADING SKELETON ─── */}
        {loading && (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-14 bg-zinc-900/50 border border-zinc-800 animate-pulse"
                style={{ animationDelay: `${i * 0.04}s` }} />
            ))}
          </div>
        )}

        {/* ─── EMPTY STATE ─── */}
        {!loading && entries.length === 0 && (
          <div className="border border-zinc-800 p-16 text-center relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-zinc-700" />
            <div className="text-4xl mb-4">⚔️</div>
            <p className="text-zinc-400 font-bold uppercase tracking-tight text-sm mb-1">No rankings yet</p>
            <p className="text-zinc-600 text-xs font-mono">Complete 3 debates to appear on the board.</p>
          </div>
        )}

        {/* ─── LEADERBOARD ROWS ─── */}
        {!loading && entries.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="space-y-1.5">

              {/* Top 3 */}
              {entries.slice(0, 3).map((entry, i) => (
                <TopRow key={entry.user_id} entry={entry} sortBy={activeTab}
                  isMe={user?.id === entry.user_id} index={i} />
              ))}

              {/* Divider */}
              {entries.length > 3 && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-zinc-900" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-800">Ranks 4–100</span>
                  <div className="flex-1 h-px bg-zinc-900" />
                </div>
              )}

              {/* Rest */}
              {entries.slice(3).map((entry, i) => (
                <Row key={entry.user_id} entry={entry} sortBy={activeTab}
                  isMe={user?.id === entry.user_id} index={i + 3} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  )
}

// ─── Top 3 row ───────────────────────────────────────────────

function TopRow({ entry, sortBy, isMe, index }: {
  entry: LeaderboardEntry
  sortBy: SortBy
  isMe: boolean
  index: number
}) {
  const initials = (entry.username ?? "?").slice(0, 2).toUpperCase()
  const colors = RANK_COLORS[entry.rank]
  const rankLabel = RANK_LABELS[entry.rank]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`flex items-center gap-4 p-4 border relative transition-all ${
        isMe ? "border-red-500/25 bg-red-500/5" : `${colors.border} ${colors.bg}`
      }`}
      style={{ boxShadow: isMe ? "none" : colors.glow }}
    >
      {/* Top-left accent */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${isMe ? "border-red-500/30" : colors.border}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${isMe ? "border-red-500/30" : colors.border}`} />

      {/* Rank */}
      <div className={`text-2xl font-black font-mono w-10 text-center flex-shrink-0 ${
        isMe ? "text-red-400" : colors.text
      }`}>
        {rankLabel}
      </div>

      {/* Avatar */}
      <div className={`w-9 h-9 flex items-center justify-center text-xs font-black text-white flex-shrink-0 overflow-hidden border ${
        isMe ? "border-red-500/30 bg-red-500/20" : `${colors.border} bg-zinc-900`
      }`}>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.username ?? ""} className="w-full h-full object-cover" />
          : <span>{initials}</span>
        }
      </div>

      {/* Name + stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`font-black text-sm uppercase tracking-tight truncate ${isMe ? "text-red-300" : "text-white"}`}>
            {entry.username}
          </p>
          {isMe && (
            <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-red-500/30 text-red-500 bg-red-500/5 flex-shrink-0">
              you
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          {entry.total_debates} debates · {entry.total_wins} wins
        </p>
      </div>

      {/* Primary stat */}
      <div className="text-right flex-shrink-0">
        <div className={`text-xl font-black font-mono ${isMe ? "text-red-400" : colors.text}`}>
          {formatValue(entry, sortBy)}
        </div>
        <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
          {formatValueUnit(sortBy)}
        </div>
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
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4) }}
      className={`flex items-center gap-3 px-4 py-3 border transition-all ${
        isMe
          ? "border-red-500/20 bg-red-500/5"
          : "border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-zinc-800"
      }`}
    >
      {/* Rank */}
      <div className="text-[11px] font-mono text-zinc-700 w-8 text-right flex-shrink-0">
        {entry.rank}
      </div>

      {/* Avatar */}
      <div className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold flex-shrink-0 overflow-hidden border ${
        isMe ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-zinc-800 bg-zinc-900 text-zinc-500"
      }`}>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.username ?? ""} className="w-full h-full object-cover" />
          : <span>{initials}</span>
        }
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className={`text-sm truncate font-mono ${isMe ? "text-red-300" : "text-zinc-400"}`}>
          {entry.username}
        </p>
        {isMe && (
          <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-red-500/30 text-red-500 flex-shrink-0">
            you
          </span>
        )}
      </div>

      {/* Secondary stats */}
      <div className="text-[10px] font-mono text-zinc-700 flex-shrink-0 hidden sm:block uppercase tracking-widest">
        {entry.total_debates}d · {entry.total_wins}w
      </div>

      {/* Primary stat */}
      <div className={`text-sm font-black font-mono w-16 text-right flex-shrink-0 ${
        isMe ? "text-red-400" : "text-zinc-400"
      }`}>
        {formatValue(entry, sortBy)}
      </div>
    </motion.div>
  )
}