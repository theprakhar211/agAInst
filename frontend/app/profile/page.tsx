"use client"
// frontend/app/profile/page.tsx

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { UserMenu } from "@/components/UserMenu"
import { getSupabaseClient } from "@/lib/supabase"
import { DebateSession } from "@/lib/types"

interface Verdict {
  winner: "user" | "ai"
  user_scores: Record<string, number>
}

const SCORE_LABELS = ["logic", "evidence", "rebuttal", "clarity"]
const SCORE_ICONS: Record<string, string> = {
  logic: "⚡", evidence: "📊", rebuttal: "🔄", clarity: "💡",
}

interface DebateWithVerdict {
  session: DebateSession
  verdict: Verdict | null
  total: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, openAuthModal, updateUsername } = useAuth()
  const [debates, setDebates] = useState<DebateWithVerdict[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameSaving, setUsernameSaving] = useState(false)

  useEffect(() => {
    if (user?.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }

    async function load() {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("debates")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error || !data) { console.error("[profile] failed to load debates:", error?.message); setLoading(false); return }

      const withVerdicts: DebateWithVerdict[] = data.map(row => {
        const session: DebateSession = {
          id: row.id, topic: row.topic,
          userSide: row.user_side as DebateSession["userSide"],
          rounds: (row.rounds as DebateSession["rounds"]) ?? [],
          status: row.status as DebateSession["status"],
          createdAt: row.created_at,
          aiGoesFirst: row.ai_goes_first ?? false,
        }
        const verdict = row.verdict as Verdict | null
        const total = verdict?.user_scores ? SCORE_LABELS.reduce((sum, l) => sum + (verdict.user_scores[l] ?? 0), 0) : 0
        if (verdict) { try { localStorage.setItem(`verdict_${row.id}`, JSON.stringify(verdict)) } catch { /* quota */ } }
        return { session, verdict, total }
      })

      setDebates(withVerdicts)
      setLoading(false)
    }
    load()
  }, [authLoading, user])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return }
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB."); return }
    setAvatarUploading(true)
    try {
      const supabase = getSupabaseClient()
      const ext = file.name.split(".").pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      if (updateError) throw updateError
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)
      setAvatarUrl(publicUrl)
    } catch (err: any) {
      console.error("[profile] avatar upload failed:", err)
      alert("Failed to upload avatar. Make sure the avatars storage bucket exists in Supabase.")
    } finally {
      setAvatarUploading(false)
    }
  }

  function startEditingUsername() {
    setUsernameInput(displayName); setUsernameError(null); setEditingUsername(true)
  }

  async function saveUsername() {
    setUsernameSaving(true); setUsernameError(null)
    const { error } = await updateUsername(usernameInput)
    setUsernameSaving(false)
    if (error) { setUsernameError(error); return }
    setEditingUsername(false)
  }

  // ── Computed stats ──────────────────────────────────────────
  const withScores = debates.filter(d => d.verdict !== null)
  const wins = debates.filter(d => d.verdict?.winner === "user").length
  const losses = debates.filter(d => d.verdict?.winner === "ai").length
  const winRate = debates.length > 0 ? Math.round((wins / debates.length) * 100) : 0
  const avgTotal = withScores.length > 0
    ? Math.round(withScores.reduce((sum, d) => sum + d.total, 0) / withScores.length * 10) / 10
    : 0
  const avgPerCategory = SCORE_LABELS.map(label => {
    const vals = withScores.map(d => d.verdict?.user_scores?.[label] ?? 0).filter(v => v > 0)
    const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0
    return { label, avg }
  })
  const bestDebate = withScores.length > 0 ? withScores.reduce((best, d) => d.total > best.total ? d : best) : null
  const recent = [...debates].slice(0, 5)
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Debater"
  const initials = displayName.slice(0, 2).toUpperCase()
  const memberSince = user ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""

  // ── Not logged in ───────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex flex-col selection:bg-red-500/30">
        {/* BG texture */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-red-600/8 blur-[120px] rounded-full" />
        </div>
        <nav className="fixed top-0 w-full z-50 bg-[#080808]/90 backdrop-blur-md border-b border-zinc-900">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
              <Image src="/logo3.png" alt="agAInst logo" width={56} height={56} priority className="rounded-md" />
              <span className="text-xl font-black tracking-tighter uppercase hidden sm:block">
                ag<span className="text-red-600">AIN</span>st
              </span>
            </div>
            <UserMenu />
          </div>
        </nav>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
          {/* Locked dossier graphic */}
          <div className="relative w-24 h-24 border border-zinc-800 flex items-center justify-center">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-500/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500/40" />
            <span className="text-4xl">🔒</span>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-500 mb-2">Access Denied</p>
            <p className="text-white font-black text-xl uppercase tracking-tight mb-2">Operator Dossier</p>
            <p className="text-zinc-500 text-sm max-w-xs">Your stats, win rate, and match history are classified. Sign in to unlock.</p>
          </div>
          <button onClick={() => openAuthModal("login")}
            className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.99]">
            Sign In →
          </button>
        </div>
      </main>
    )
  }

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

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-28 pb-24 space-y-4">

        {/* ─── DOSSIER HEADER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-zinc-800 bg-zinc-900/30 relative overflow-hidden"
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-red-500/30" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-red-500/30" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-red-500/30" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-red-500/30" />

          {/* Header label strip */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-500">Operator Dossier</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">ID: {user?.id?.slice(0, 8).toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-6 p-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0 group">
              <div className="w-20 h-20 bg-red-600 flex items-center justify-center text-2xl font-black text-white overflow-hidden border border-zinc-700 relative">
                {avatarUploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              {/* Upload hover overlay */}
              <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                title="Change avatar">
                <span className="text-white text-sm">📷</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1">
              {editingUsername ? (
                <div className="space-y-2">
                  <input
                    value={usernameInput}
                    onChange={e => { setUsernameInput(e.target.value); setUsernameError(null) }}
                    onKeyDown={e => { if (e.key === "Enter") saveUsername(); if (e.key === "Escape") setEditingUsername(false) }}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500/50 px-3 py-1.5 text-white text-sm font-mono outline-none transition-colors"
                    maxLength={30}
                    autoFocus
                  />
                  {usernameError && <p className="text-red-400 text-xs font-mono">{usernameError}</p>}
                  <div className="flex gap-2">
                    <button onClick={saveUsername} disabled={usernameSaving}
                      className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-mono uppercase tracking-widest transition-all">
                      {usernameSaving ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingUsername(false)}
                      className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-500 hover:text-white font-mono uppercase tracking-widest transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group mb-0.5">
                  <h1 className="text-xl font-black uppercase tracking-tight text-white truncate">{displayName}</h1>
                  <button onClick={startEditingUsername}
                    className="text-zinc-700 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                    title="Edit username">✏️</button>
                </div>
              )}
              <p className="text-zinc-600 text-xs font-mono truncate">{user?.email}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-700 mt-1.5">
                Active since <span className="text-zinc-600">{memberSince}</span>
              </p>
              <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                className="text-[10px] font-mono uppercase tracking-widest text-zinc-700 hover:text-zinc-500 transition-colors mt-1.5">
                {avatarUploading ? "Uploading…" : "Change avatar"}
              </button>
            </div>

            {/* Win rate ring — right side */}
            <div className="flex-shrink-0 text-center hidden sm:block">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none"
                    stroke={winRate >= 50 ? "rgba(16,185,129,0.7)" : "rgba(239,68,68,0.7)"}
                    strokeWidth="4"
                    strokeDasharray={`${(winRate / 100) * 175.9} 175.9`}
                    strokeLinecap="butt"
                  />
                </svg>
                <div className="text-center z-10">
                  <div className={`text-base font-black leading-none ${winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>{winRate}%</div>
                </div>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 mt-1">Win rate</p>
            </div>
          </div>
        </motion.div>

        {/* ─── STAT GRID ─── */}
        <motion.div className="grid grid-cols-4 gap-2"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {[
            { label: "Matches",  value: debates.length,  color: "text-white",        sub: "total" },
            { label: "Wins",     value: wins,            color: "text-emerald-400",  sub: "victories" },
            { label: "Losses",   value: losses,          color: "text-red-400",      sub: "defeats" },
            { label: "Avg score",value: `${avgTotal}`,   color: "text-zinc-300",     sub: "out of 40" },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              className="bg-zinc-900/40 border border-zinc-800 p-4 text-center relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700" />
              <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── LOADING SKELETON ─── */}
        {loading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* ─── EMPTY STATE ─── */}
        {!loading && debates.length === 0 && (
          <div className="border border-zinc-800 p-12 text-center relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-zinc-700" />
            <div className="text-4xl mb-4">⚔️</div>
            <p className="text-zinc-400 font-bold uppercase tracking-tight text-sm mb-1">No matches on record</p>
            <p className="text-zinc-600 text-xs font-mono mb-6">Complete a debate to populate your dossier.</p>
            <button onClick={() => router.push("/")}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              Enter Arena →
            </button>
          </div>
        )}

        {!loading && debates.length > 0 && (
          <>
            {/* ─── SKILL BREAKDOWN ─── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="border border-zinc-800 bg-zinc-900/30 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />

              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">Skill Analysis</span>
                <span className="text-[10px] font-mono text-zinc-700">{avgTotal}/40 avg</span>
              </div>

              <div className="p-5 space-y-4">
                {avgPerCategory.map((cat, idx) => (
                  <div key={cat.label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                        {SCORE_ICONS[cat.label]} {cat.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-300 font-mono">
                          {cat.avg}<span className="text-zinc-700">/10</span>
                        </span>
                        {/* Qualitative tag */}
                        <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                          cat.avg >= 8 ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
                          : cat.avg >= 6 ? "text-amber-500 border-amber-500/20 bg-amber-500/5"
                          : "text-red-500 border-red-500/20 bg-red-500/5"
                        }`}>
                          {cat.avg >= 8 ? "Strong" : cat.avg >= 6 ? "Average" : "Weak"}
                        </span>
                      </div>
                    </div>
                    <div className="h-px bg-zinc-800 overflow-hidden">
                      <motion.div
                        className={`h-full ${cat.avg >= 8 ? "bg-emerald-500" : cat.avg >= 6 ? "bg-amber-500" : "bg-red-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.avg * 10}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + idx * 0.08, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── BEST MATCH ─── */}
            {bestDebate && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                onClick={() => router.push(`/verdict/${bestDebate.session.id}`)}
                className="border border-emerald-500/20 bg-emerald-500/5 p-5 cursor-pointer hover:border-emerald-500/40 transition-all relative group">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500/30" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-500/30" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-600 mb-2">⭐ Best Match</p>
                    <p className="text-white font-bold text-sm mb-2 group-hover:text-emerald-300 transition-colors">{bestDebate.session.topic}</p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                      <span>Argued <span className={`font-bold ${bestDebate.session.userSide === "for" ? "text-emerald-500" : "text-red-500"}`}>{bestDebate.session.userSide}</span></span>
                      <span>·</span>
                      <span>{new Date(bestDebate.session.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-black text-emerald-400 font-mono">{bestDebate.total}</div>
                    <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">/ 40</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── MATCH LOG ─── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="border border-zinc-800 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />

              {/* Section label */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">Recent Matches</span>
                <span className="text-[10px] font-mono text-zinc-700">{Math.min(recent.length, 5)} of {debates.length}</span>
              </div>

              <div className="divide-y divide-zinc-900">
                {recent.map((d, i) => (
                  <motion.div key={d.session.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.05 }}
                    onClick={() => d.session.status === "complete" && router.push(`/verdict/${d.session.id}`)}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                      d.session.status === "complete"
                        ? "cursor-pointer hover:bg-zinc-900/50"
                        : "opacity-40"
                    }`}>

                    {/* Result indicator */}
                    <div className={`w-1 h-8 flex-shrink-0 ${
                      d.verdict?.winner === "user" ? "bg-emerald-500"
                      : d.verdict?.winner === "ai" ? "bg-red-500"
                      : "bg-zinc-700"
                    }`} />

                    {/* Result label */}
                    <div className="w-12 flex-shrink-0">
                      <span className={`text-[9px] font-mono uppercase tracking-widest ${
                        d.verdict?.winner === "user" ? "text-emerald-500"
                        : d.verdict?.winner === "ai" ? "text-red-500"
                        : "text-zinc-700"
                      }`}>
                        {d.verdict?.winner === "user" ? "Win" : d.verdict?.winner === "ai" ? "Loss" : "—"}
                      </span>
                    </div>

                    {/* Topic */}
                    <p className="flex-1 text-zinc-300 text-sm truncate font-medium">{d.session.topic}</p>

                    {/* Right side metadata */}
                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      {d.verdict && (
                        <span className={`text-xs font-black font-mono ${
                          d.verdict.winner === "user" ? "text-emerald-400" : "text-zinc-500"
                        }`}>{d.total}<span className="text-zinc-700 font-normal">/40</span></span>
                      )}
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                        d.session.userSide === "for"
                          ? "text-emerald-600 border-emerald-600/20"
                          : "text-red-600 border-red-600/20"
                      }`}>{d.session.userSide}</span>
                      <span className="text-zinc-700 text-[10px] font-mono hidden sm:block">
                        {new Date(d.session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {debates.length > 5 && (
                <div className="border-t border-zinc-900">
                  <button onClick={() => router.push("/history")}
                    className="w-full py-3.5 text-[10px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-all hover:bg-zinc-900/30">
                    View all {debates.length} matches →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </main>
  )
}