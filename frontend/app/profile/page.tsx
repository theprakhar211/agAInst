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
  logic: "⚡", evidence: "📊", rebuttal: "🔄", clarity: "💡"
}

interface DebateWithVerdict {
  session: DebateSession
  verdict: Verdict | null
  total: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, openAuthModal } = useAuth()
  const [debates, setDebates] = useState<DebateWithVerdict[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load avatar from user metadata
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url)
    }
  }, [user])

  // Load debates + verdicts directly from Supabase (not localStorage)
  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }

    async function load() {
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error || !data) {
        console.error('[profile] failed to load debates:', error?.message)
        setLoading(false)
        return
      }

      const withVerdicts: DebateWithVerdict[] = data.map(row => {
        const session: DebateSession = {
          id: row.id,
          topic: row.topic,
          userSide: row.user_side as DebateSession['userSide'],
          rounds: (row.rounds as DebateSession['rounds']) ?? [],
          status: row.status as DebateSession['status'],
          createdAt: row.created_at,
          aiGoesFirst: row.ai_goes_first ?? false,
        }

        const verdict = row.verdict as Verdict | null
        const total = verdict?.user_scores
          ? SCORE_LABELS.reduce((sum, l) => sum + (verdict.user_scores[l] ?? 0), 0)
          : 0

        // Also mirror to localStorage so verdict page still works
        if (verdict) {
          try { localStorage.setItem(`verdict_${row.id}`, JSON.stringify(verdict)) } catch { /* quota */ }
        }

        return { session, verdict, total }
      })

      setDebates(withVerdicts)
      setLoading(false)
    }

    load()
  }, [authLoading, user])

  // ── Avatar upload ───────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return }
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return }

    setAvatarUploading(true)

    try {
      const supabase = getSupabaseClient()
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      // Update profiles table too
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      setAvatarUrl(publicUrl)
    } catch (err: any) {
      console.error('[profile] avatar upload failed:', err)
      alert('Failed to upload avatar. Make sure the avatars storage bucket exists in Supabase.')
    } finally {
      setAvatarUploading(false)
    }
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
    const avg = vals.length > 0
      ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
      : 0
    return { label, avg }
  })

  const bestDebate = withScores.length > 0
    ? withScores.reduce((best, d) => d.total > best.total ? d : best)
    : null

  const recent = [...debates].slice(0, 5)

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Debater"
  const initials = displayName.slice(0, 2).toUpperCase()
  const memberSince = user
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : ""

  // ── Not logged in ───────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex flex-col">
        <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/logo3.png" alt="agAInst logo" width={102} height={102} priority className="rounded-lg" />
          </div>
          <UserMenu />
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="text-5xl mb-2">👤</div>
          <p className="text-white font-bold text-lg">Sign in to view your profile</p>
          <p className="text-zinc-500 text-sm max-w-xs">Your stats, win rate, and debate history live here.</p>
          <button
            onClick={() => openAuthModal("login")}
            className="mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Sign in
          </button>
        </div>
      </main>
    )
  }

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

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5"
        >
          {/* Avatar with upload overlay */}
          <div className="relative flex-shrink-0 group">
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-xl font-black text-white overflow-hidden border-2 border-zinc-700">
              {avatarUploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {/* Upload overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              title="Change avatar"
            >
              <span className="text-white text-lg">📷</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
            <p className="text-zinc-500 text-xs mt-0.5 truncate">{user?.email}</p>
            <p className="text-zinc-700 text-xs mt-1">Member since {memberSince}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
            >
              {avatarUploading ? "Uploading…" : "Change avatar"}
            </button>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-3"
        >
          {[
            { label: "Debates",  value: debates.length,   color: "text-white" },
            { label: "Wins",     value: wins,             color: "text-emerald-400" },
            { label: "Losses",   value: losses,           color: "text-red-400" },
            { label: "Win rate", value: `${winRate}%`,    color: winRate >= 50 ? "text-emerald-400" : "text-red-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center"
            >
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-zinc-600 text-xs mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && debates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">⚔️</div>
            <p className="text-zinc-400 font-semibold mb-2">No completed debates yet</p>
            <p className="text-zinc-600 text-sm mb-6">Finish a debate to see your stats here.</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Start a debate
            </button>
          </div>
        )}

        {!loading && debates.length > 0 && (
          <>
            {/* Score breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Avg scores</p>
                <p className="text-xs text-zinc-600">{avgTotal}/40 overall</p>
              </div>
              <div className="space-y-3">
                {avgPerCategory.map((cat, idx) => (
                  <div key={cat.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <span>{SCORE_ICONS[cat.label]}</span>{cat.label}
                      </span>
                      <span className="text-xs font-medium text-zinc-300">{cat.avg}/10</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.avg * 10}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + idx * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Best debate */}
            {bestDebate && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5 cursor-pointer hover:border-emerald-500/30 transition-colors"
                onClick={() => router.push(`/verdict/${bestDebate.session.id}`)}
              >
                <p className="text-xs text-emerald-600 uppercase tracking-widest mb-2">⭐ Best debate</p>
                <p className="text-white font-medium text-sm mb-1">{bestDebate.session.topic}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="text-emerald-400 font-semibold">{bestDebate.total}/40</span>
                  <span>·</span>
                  <span>Argued <span className="text-zinc-300 uppercase">{bestDebate.session.userSide}</span></span>
                  <span>·</span>
                  <span>{new Date(bestDebate.session.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            )}

            {/* Recent debates */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Recent debates</p>
              <div className="space-y-2">
                {recent.map((d, i) => (
                  <motion.div
                    key={d.session.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    onClick={() => d.session.status === "complete" && router.push(`/verdict/${d.session.id}`)}
                    className={`flex items-center gap-4 px-4 py-3 bg-zinc-900/40 border border-zinc-800 rounded-xl transition-colors ${
                      d.session.status === "complete" ? "cursor-pointer hover:border-zinc-600" : "opacity-50"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      d.verdict?.winner === "user" ? "bg-emerald-400"
                      : d.verdict?.winner === "ai" ? "bg-red-400"
                      : "bg-zinc-600"
                    }`} />
                    <p className="flex-1 text-zinc-300 text-sm truncate">{d.session.topic}</p>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {d.verdict && (
                        <span className={`text-xs font-semibold ${d.verdict.winner === "user" ? "text-emerald-400" : "text-red-400"}`}>
                          {d.total}/40
                        </span>
                      )}
                      <span className="text-zinc-600 text-xs">
                        {new Date(d.session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {debates.length > 5 && (
                <button
                  onClick={() => router.push("/history")}
                  className="mt-3 w-full py-2.5 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 rounded-xl transition-all text-xs"
                >
                  View all {debates.length} debates →
                </button>
              )}
            </motion.div>
          </>
        )}
      </div>
    </main>
  )
}