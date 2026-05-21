// frontend/lib/storage.ts
import { DebateSession } from "./types"
import { PvPSession } from "./types"

const KEY = "agAInst_history"

export function saveDebate(session: DebateSession) {
  const all = getAllDebates()
  const updated = [session, ...all.filter(d => d.id !== session.id)]
  localStorage.setItem(KEY, JSON.stringify(updated.slice(0, 20))) // keep last 20
}

export function getAllDebates(): DebateSession[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch { return [] }
}

export function getDebate(id: string): DebateSession | null {
  return getAllDebates().find(d => d.id === id) ?? null
}

export function saveVerdict(debateId: string, verdict: object) {
  localStorage.setItem(`verdict_${debateId}`, JSON.stringify(verdict))
}

export function getVerdict(debateId: string) {
  try {
    const v = localStorage.getItem(`verdict_${debateId}`)
    return v ? JSON.parse(v) : null
  } catch { return null }
}

export function savePvPSession(session: PvPSession) {
  const all = getAllPvPSessions()
  const updated = [session, ...all.filter(s => s.id !== session.id)]
  localStorage.setItem("agAInst_pvp", JSON.stringify(updated.slice(0, 20)))
}

export function getAllPvPSessions(): PvPSession[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem("agAInst_pvp") || "[]") }
  catch { return [] }
}

export function getPvPSession(id: string): PvPSession | null {
  return getAllPvPSessions().find(s => s.id === id) ?? null
}