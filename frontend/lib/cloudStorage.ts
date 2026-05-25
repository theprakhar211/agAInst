// frontend/lib/cloudStorage.ts
// ─────────────────────────────────────────────────────────────
// Cloud sync layer. Wraps your existing storage.ts functions.
// 
// Your existing storage.ts is UNCHANGED. This file adds cloud
// sync on top. Import from here instead of storage.ts when you
// want cloud sync. For pages that don't need it, storage.ts
// still works exactly as before.
//
// Guest users  → localStorage only (identical to current behaviour)
// Logged-in    → localStorage + Supabase (dual write)
// First login  → migrates existing localStorage to Supabase
// ─────────────────────────────────────────────────────────────

import { getSupabaseClient } from './supabase'
import {
  saveDebate as lsSaveDebate,
  getAllDebates as lsGetAllDebates,
  getDebate as lsGetDebate,
  saveVerdict as lsSaveVerdict,
  getVerdict as lsGetVerdict,
  savePvPSession as lsSavePvPSession,
  getAllPvPSessions as lsGetAllPvPSessions,
  getPvPSession as lsGetPvPSession,
} from './storage'
import type { DebateSession, PvPSession } from './types'

// ─── helpers ────────────────────────────────────────────────

function getCurrentUserId(): string | null {
  // Sync read — the supabase client caches the session
  const supabase = getSupabaseClient()
  // @ts-ignore — internal sync access
  return supabase.auth._session?.user?.id ?? null
}

// ─── DebateSession ───────────────────────────────────────────

export async function saveDebate(session: DebateSession): Promise<void> {
  // Always write localStorage first (instant, no await needed)
  lsSaveDebate(session)

  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = getSupabaseClient()
  const { error } = await supabase.from('debates').upsert({
    id: session.id,
    user_id: userId,
    topic: session.topic,
    user_side: session.userSide,
    status: session.status,
    ai_goes_first: session.aiGoesFirst,
    created_at: session.createdAt,
    rounds: session.rounds,
    // verdict stays null until saveVerdict is called
  }, { onConflict: 'id' })

  if (error) console.error('[cloudStorage] saveDebate failed:', error.message)
}

export async function saveVerdict(debateId: string, verdict: object): Promise<void> {
  // Always write localStorage first
  lsSaveVerdict(debateId, verdict)

  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = getSupabaseClient()
  // Update the verdict column + mark complete on the existing row
  const { error } = await supabase
    .from('debates')
    .update({ verdict, status: 'complete' })
    .eq('id', debateId)
    .eq('user_id', userId)

  if (error) console.error('[cloudStorage] saveVerdict failed:', error.message)
}

export async function getAllDebates(): Promise<DebateSession[]> {
  const userId = getCurrentUserId()

  if (!userId) {
    // Guest — return localStorage as before
    return lsGetAllDebates()
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('debates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) {
    console.error('[cloudStorage] getAllDebates failed:', error?.message)
    return lsGetAllDebates() // fallback
  }

  // Map DB rows → DebateSession shape
  const sessions: DebateSession[] = data.map(row => ({
    id: row.id,
    topic: row.topic,
    userSide: row.user_side as DebateSession['userSide'],
    rounds: (row.rounds as DebateSession['rounds']) ?? [],
    status: row.status as DebateSession['status'],
    createdAt: row.created_at,
    aiGoesFirst: row.ai_goes_first,
  }))

  // Mirror to localStorage so the rest of the app still works offline
  // (replace entire list — cloud is source of truth when logged in)
  try {
    localStorage.setItem('agAInst_history', JSON.stringify(sessions.slice(0, 20)))

    // Also mirror verdicts into their separate keys
    data.forEach(row => {
      if (row.verdict) {
        localStorage.setItem(`verdict_${row.id}`, JSON.stringify(row.verdict))
      }
    })
  } catch { /* storage quota — non-fatal */ }

  return sessions
}

export async function getDebate(id: string): Promise<DebateSession | null> {
  const userId = getCurrentUserId()

  if (!userId) return lsGetDebate(id)

  // Try localStorage first (fast path — already synced by getAllDebates)
  const cached = lsGetDebate(id)
  if (cached) return cached

  // Fallback: fetch single row from Supabase
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('debates')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    topic: data.topic,
    userSide: data.user_side as DebateSession['userSide'],
    rounds: (data.rounds as DebateSession['rounds']) ?? [],
    status: data.status as DebateSession['status'],
    createdAt: data.created_at,
    aiGoesFirst: data.ai_goes_first,
  }
}

export function getVerdict(debateId: string) {
  // Verdict is always available in localStorage after first load
  // (mirrored from Supabase by getAllDebates / getDebate)
  return lsGetVerdict(debateId)
}

// ─── PvPSession ──────────────────────────────────────────────

export async function savePvPSession(session: PvPSession): Promise<void> {
  lsSavePvPSession(session)

  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = getSupabaseClient()
  const { error } = await supabase.from('pvp_sessions').upsert({
    id: session.id,
    user_id: userId,
    topic: session.topic,
    player1_side: session.player1Side,
    player2_side: session.player2Side,
    player1_name: session.player1Name,
    player2_name: session.player2Name,
    status: session.status,
    created_at: session.createdAt,
    rounds: session.rounds,
  }, { onConflict: 'id' })

  if (error) console.error('[cloudStorage] savePvPSession failed:', error.message)
}

export async function savePvPVerdict(sessionId: string, verdict: object): Promise<void> {
  lsSaveVerdict(sessionId, verdict)

  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('pvp_sessions')
    .update({ verdict, status: 'complete' })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) console.error('[cloudStorage] savePvPVerdict failed:', error.message)
}

export async function getAllPvPSessions(): Promise<PvPSession[]> {
  const userId = getCurrentUserId()
  if (!userId) return lsGetAllPvPSessions()

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('pvp_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) return lsGetAllPvPSessions()

  const sessions: PvPSession[] = data.map(row => ({
    id: row.id,
    topic: row.topic,
    player1Side: row.player1_side as PvPSession['player1Side'],
    player2Side: row.player2_side as PvPSession['player2Side'],
    player1Name: row.player1_name,
    player2Name: row.player2_name,
    rounds: (row.rounds as PvPSession['rounds']) ?? [],
    status: row.status as PvPSession['status'],
    createdAt: row.created_at,
  }))

  try {
    localStorage.setItem('agAInst_pvp', JSON.stringify(sessions.slice(0, 20)))
  } catch { /* non-fatal */ }

  return sessions
}

export function getPvPSession(id: string): PvPSession | null {
  return lsGetPvPSession(id)
}

// ─── Migration: localStorage → Supabase on first login ──────

let migrationDone = false

export async function migrateLocalToCloud(userId: string): Promise<void> {
  if (migrationDone) return
  migrationDone = true

  const supabase = getSupabaseClient()

  // Migrate VS AI debates
  const localDebates = lsGetAllDebates()
  if (localDebates.length > 0) {
    const rows = localDebates.map(s => ({
      id: s.id,
      user_id: userId,
      topic: s.topic,
      user_side: s.userSide,
      status: s.status,
      ai_goes_first: s.aiGoesFirst,
      created_at: s.createdAt,
      rounds: s.rounds,
      verdict: lsGetVerdict(s.id),
    }))

    const { error } = await supabase
      .from('debates')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })

    if (error) console.error('[cloudStorage] migration (debates) failed:', error.message)
    else console.log(`✓ Migrated ${rows.length} local debates to cloud`)
  }

  // Migrate PvP sessions
  const localPvP = lsGetAllPvPSessions()
  if (localPvP.length > 0) {
    const rows = localPvP.map(s => ({
      id: s.id,
      user_id: userId,
      topic: s.topic,
      player1_side: s.player1Side,
      player2_side: s.player2Side,
      player1_name: s.player1Name,
      player2_name: s.player2Name,
      status: s.status,
      created_at: s.createdAt,
      rounds: s.rounds,
      verdict: lsGetVerdict(s.id),
    }))

    const { error } = await supabase
      .from('pvp_sessions')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })

    if (error) console.error('[cloudStorage] migration (pvp) failed:', error.message)
    else console.log(`✓ Migrated ${rows.length} local PvP sessions to cloud`)
  }
}
