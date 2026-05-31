"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getAllDebates, getAllPvPSessions } from "@/lib/cloudStorage"
import { getSupabaseClient } from "@/lib/supabase"
import { DebateSession, PvPSession } from "@/lib/types"
import { type OnlinePvPRoom } from "@/lib/onlinePvp"
import { useAuth } from "@/context/AuthContext"
import { UserMenu } from "@/components/UserMenu"
import Image from "next/image"

type Tab = "all" | "vs-ai" | "pvp" | "online"

export default function HistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading, openAuthModal } = useAuth()
  const [debates, setDebates] = useState<DebateSession[]>([])
  const [pvpSessions, setPvpSessions] = useState<PvPSession[]>([])
  const [onlineRooms, setOnlineRooms] = useState<OnlinePvPRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("all")

  useEffect(() => {
    if (authLoading) return
    async function load() {
      const [d, p] = await Promise.all([getAllDebates(), getAllPvPSessions()])
      setDebates(d)
      setPvpSessions(p)

      if (user) {
        const supabase = getSupabaseClient()
        const playerId = localStorage.getItem("against_player_id")
        if (playerId) {
          const { data } = await supabase
            .from("online_pvp_rooms")
            .select("*")
            .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
            .eq("status", "complete")
            .order("created_at", { ascending: false })
            .limit(20)
          setOnlineRooms((data ?? []) as OnlinePvPRoom[])
        }
      }
      setLoading(false)
    }
    load()
  }, [authLoading, user])

  type AnySession = { id: string; createdAt: number; type: "ai" | "pvp" | "online" }
  const allSorted: AnySession[] = [
    ...debates.map(d => ({ id: d.id, createdAt: d.createdAt, type: "ai" as const })),
    ...pvpSessions.map(p => ({ id: p.id, createdAt: p.createdAt, type: "pvp" as const })),
    ...onlineRooms.map(r => ({ id: r.code, createdAt: new Date(r.created_at).getTime(), type: "online" as const })),
  ].sort((a, b) => b.createdAt - a.createdAt)

  const debateMap = Object.fromEntries(debates.map(d => [d.id, d]))
  const pvpMap = Object.fromEntries(pvpSessions.map(p => [p.id, p]))
  const onlineMap = Object.fromEntries(onlineRooms.map(r => [r.code, r]))
  const totalCount = debates.length + pvpSessions.length + onlineRooms.length

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "all",    label: "All",       count: totalCount },
    { key: "vs-ai",  label: "VS AI",     count: debates.length },
    { key: "pvp",    label: "2 Player",  count: pvpSessions.length },
    { key: "online", label: "Online",    count: onlineRooms.length },
  ]

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
            <button onClick={() => router.push("/leaderboard")}
              className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-4 py-2 transition-all">
              🏆 Leaderboard
            </button>
            <UserMenu />
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-28 pb-24">

        {/* ─── HEADER ─── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 mb-5">
            {user
              ? <><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /><span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Synced to cloud</span></>
              : <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Match Archive</span>
            }
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Past Debates</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-700 mt-1.5">
                {totalCount > 0 ? `${totalCount} matches on record` : "No matches yet"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => router.push("/")}
                className="text-[11px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">
                ← Arena
              </button>
              {!user && !authLoading && (
                <button onClick={() => openAuthModal("signup")}
                  className="text-[10px] font-mono uppercase tracking-widest text-red-600 hover:text-red-500 transition-colors">
                  Sign in to sync →
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── TABS ─── */}
        {!loading && totalCount > 0 && (
          <div className="flex gap-0 mb-6 border border-zinc-800">
            {TABS.map((t, i) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 text-[11px] font-mono uppercase tracking-widest transition-all relative ${
                  tab === t.key
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30"
                } ${i < TABS.length - 1 ? "border-r border-zinc-800" : ""}`}>
                {tab === t.key && (
                  <motion.div layoutId="history-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-red-600" />
                )}
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className={`ml-1.5 text-[9px] font-mono ${tab === t.key ? "text-red-500" : "text-zinc-700"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ─── LOADING ─── */}
        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-[72px] bg-zinc-900/50 border border-zinc-800 animate-pulse"
                style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        )}

        {/* ─── EMPTY STATE ─── */}
        {!loading && totalCount === 0 && (
          <div className="border border-zinc-800 p-16 text-center relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-zinc-700" />
            <div className="text-4xl mb-4">⚔️</div>
            <p className="text-zinc-400 font-bold uppercase tracking-tight text-sm mb-1">No matches on record</p>
            <p className="text-zinc-600 text-xs font-mono mb-6">Your debate history will appear here.</p>
            <button onClick={() => router.push("/")}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              Enter Arena →
            </button>
          </div>
        )}

        {/* ─── CONTENT ─── */}
        {!loading && totalCount > 0 && (
          <div className="space-y-2">

            {/* All tab */}
            {tab === "all" && allSorted.map((s, i) =>
              s.type === "ai" ? (
                <AICard key={s.id} debate={debateMap[s.id]} index={i}
                  onClick={() => debateMap[s.id]?.status === "complete"
                    ? router.push(`/verdict/${s.id}`) : router.push(`/debate/${s.id}`)} />
              ) : s.type === "pvp" ? (
                <PvPCard key={s.id} session={pvpMap[s.id]} index={i}
                  onClick={() => pvpMap[s.id]?.status === "complete"
                    ? router.push(`/pvp/verdict/${s.id}`) : router.push(`/pvp/${s.id}`)} />
              ) : (
                <OnlineCard key={s.id} room={onlineMap[s.id]} index={i}
                  onClick={() => router.push(`/online-pvp/verdict/${s.id}`)} />
              )
            )}

            {/* VS AI tab */}
            {tab === "vs-ai" && debates.length === 0 && <EmptyTab label="No VS AI debates yet." />}
            {tab === "vs-ai" && debates.map((d, i) => (
              <AICard key={d.id} debate={d} index={i}
                onClick={() => d.status === "complete"
                  ? router.push(`/verdict/${d.id}`) : router.push(`/debate/${d.id}`)} />
            ))}

            {/* PvP tab */}
            {tab === "pvp" && pvpSessions.length === 0 && <EmptyTab label="No 2 Player debates yet." />}
            {tab === "pvp" && pvpSessions.map((p, i) => (
              <PvPCard key={p.id} session={p} index={i}
                onClick={() => p.status === "complete"
                  ? router.push(`/pvp/verdict/${p.id}`) : router.push(`/pvp/${p.id}`)} />
            ))}

            {/* Online tab */}
            {tab === "online" && onlineRooms.length === 0 && <EmptyTab label="No online debates yet." />}
            {tab === "online" && onlineRooms.map((r, i) => (
              <OnlineCard key={r.code} room={r} index={i}
                onClick={() => router.push(`/online-pvp/verdict/${r.code}`)} />
            ))}

          </div>
        )}
      </div>
    </main>
  )
}

// ─── Empty tab state ──────────────────────────────────────────

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="border border-zinc-900 p-8 text-center">
      <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">{label}</p>
    </div>
  )
}

// ─── Shared card shell ────────────────────────────────────────

function CardShell({ onClick, complete, children, accentColor = "zinc" }: {
  onClick: () => void
  complete: boolean
  children: React.ReactNode
  accentColor?: "zinc" | "red" | "blue" | "green"
}) {
  const accent = {
    zinc:  "hover:border-zinc-700",
    red:   "hover:border-red-500/30",
    blue:  "hover:border-blue-500/30",
    green: "hover:border-emerald-500/30",
  }[accentColor]

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
      className={`border border-zinc-900 bg-zinc-900/20 p-4 cursor-pointer transition-all relative group ${accent} ${
        !complete ? "opacity-50" : ""
      }`}
    >
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800 group-hover:border-zinc-600 transition-colors" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-800 group-hover:border-zinc-600 transition-colors" />
      {children}
    </motion.div>
  )
}

// ─── Status chip ──────────────────────────────────────────────

function StatusChip({ complete }: { complete: boolean }) {
  return (
    <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border flex-shrink-0 ${
      complete
        ? "text-emerald-600 border-emerald-600/20 bg-emerald-600/5"
        : "text-zinc-600 border-zinc-700 bg-zinc-800/50"
    }`}>
      {complete ? "Complete" : "In progress"}
    </span>
  )
}

// ─── Mode chip ────────────────────────────────────────────────

function ModeChip({ label }: { label: string }) {
  return (
    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 border border-zinc-800 px-2 py-0.5 flex-shrink-0">
      {label}
    </span>
  )
}

// ─── VS AI card ───────────────────────────────────────────────

function AICard({ debate, index, onClick }: {
  debate: DebateSession
  index: number
  onClick: () => void
}) {
  const complete = debate.status === "complete"
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.5) }}>
      <CardShell onClick={onClick} complete={complete} accentColor="red">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <p className="text-zinc-200 text-sm font-medium truncate leading-snug group-hover:text-white transition-colors">
            {debate.topic}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ModeChip label="VS AI" />
            <StatusChip complete={complete} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            Argued <span className={`font-bold ${debate.userSide === "for" ? "text-emerald-600" : "text-red-600"}`}>
              {debate.userSide}
            </span>
          </span>
          <span className="text-zinc-800">·</span>
          <span className="text-[10px] font-mono text-zinc-700">{debate.rounds.length}/3 rounds</span>
          <span className="text-zinc-800">·</span>
          <span className="text-[10px] font-mono text-zinc-700">
            {new Date(debate.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardShell>
    </motion.div>
  )
}

// ─── PvP card ─────────────────────────────────────────────────

function PvPCard({ session, index, onClick }: {
  session: PvPSession
  index: number
  onClick: () => void
}) {
  const complete = session.status === "complete"
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.5) }}>
      <CardShell onClick={onClick} complete={complete} accentColor="blue">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <p className="text-zinc-200 text-sm font-medium truncate leading-snug group-hover:text-white transition-colors">
            {session.topic}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ModeChip label="2 Player" />
            <StatusChip complete={complete} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-red-500">{session.player1Name}</span>
          <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">for</span>
          <span className="text-zinc-800">—</span>
          <span className="text-[10px] font-mono text-blue-500">{session.player2Name}</span>
          <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">against</span>
          <span className="text-zinc-800">·</span>
          <span className="text-[10px] font-mono text-zinc-700">
            {new Date(session.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardShell>
    </motion.div>
  )
}

// ─── Online PvP card ──────────────────────────────────────────

function OnlineCard({ room, index, onClick }: {
  room: OnlinePvPRoom
  index: number
  onClick: () => void
}) {
  if (!room) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.5) }}>
      <CardShell onClick={onClick} complete={true} accentColor="green">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <p className="text-zinc-200 text-sm font-medium truncate leading-snug group-hover:text-white transition-colors">
            {room.topic}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ModeChip label="Online" />
            <StatusChip complete={true} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-red-500">{room.player1_name}</span>
          <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">for</span>
          <span className="text-zinc-800">—</span>
          <span className="text-[10px] font-mono text-blue-500">{room.player2_name ?? "?"}</span>
          <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">against</span>
          <span className="text-zinc-800">·</span>
          <span className="text-[10px] font-mono text-zinc-700">#{room.code}</span>
          <span className="text-zinc-800">·</span>
          <span className="text-[10px] font-mono text-zinc-700">
            {new Date(room.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardShell>
    </motion.div>
  )
}