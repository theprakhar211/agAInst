// frontend/lib/onlinePvp.ts
// All room operations + Realtime subscription for online PvP

import { getSupabaseClient } from './supabase'

export interface OnlinePvPRoom {
  code: string
  share_token: string
  topic: string
  player1_id: string
  player1_name: string
  player1_side: 'for' | 'against'
  player2_id: string | null
  player2_name: string | null
  player2_side: 'for' | 'against' | null
  status: 'waiting' | 'round1' | 'round2' | 'round3' | 'judging' | 'complete'
  current_turn: 'player1' | 'player2'
  p1_submitted: string | null
  p2_submitted: string | null
  rounds: RoomRound[]
  verdict: any | null
  created_at: string
  expires_at: string
}

export interface RoomRound {
  number: 1 | 2 | 3
  name: 'opening' | 'rebuttal' | 'closing'
  player1Argument: string
  player2Argument: string
}

const ROUND_NAMES: Record<number, 'opening' | 'rebuttal' | 'closing'> = {
  1: 'opening', 2: 'rebuttal', 3: 'closing'
}

// Generate a random 6-digit room code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Get or create an anonymous player ID (persisted in localStorage)
export function getPlayerId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID()
  const key = 'against_player_id'
  let id = localStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
  return id
}

// ─── Room operations ─────────────────────────────────────────

export async function createRoom(
  topic: string,
  playerName: string,
  playerSide: 'for' | 'against',
  playerId: string
): Promise<OnlinePvPRoom | null> {
  const supabase = getSupabaseClient()
  const code = generateCode()

  const { data, error } = await supabase
    .from('online_pvp_rooms')
    .insert({
      code,
      topic,
      player1_id: playerId,
      player1_name: playerName,
      player1_side: playerSide,
      status: 'waiting',
    })
    .select()
    .single()

  if (error) { console.error('[onlinePvp] createRoom failed:', error.message); return null }
  return data as OnlinePvPRoom
}

export async function joinRoom(
  code: string,
  playerName: string,
  playerId: string
): Promise<{ room: OnlinePvPRoom | null; error: string | null }> {
  const supabase = getSupabaseClient()

  // Fetch room first
  const { data: room, error: fetchError } = await supabase
    .from('online_pvp_rooms')
    .select('*')
    .eq('code', code.trim())
    .single()

  if (fetchError || !room) return { room: null, error: 'Room not found. Check the code and try again.' }
  if (room.status !== 'waiting') return { room: null, error: 'This room has already started.' }
  if (room.player1_id === playerId) return { room: null, error: "You can't join your own room." }
  if (room.player2_id) return { room: null, error: 'This room is full.' }

  const player2Side = room.player1_side === 'for' ? 'against' : 'for'

  const { data: updated, error: updateError } = await supabase
    .from('online_pvp_rooms')
    .update({
      player2_id: playerId,
      player2_name: playerName,
      player2_side: player2Side,
      status: 'round1',
      current_turn: 'player1',
    })
    .eq('code', code)
    .select()
    .single()

  if (updateError) return { room: null, error: 'Failed to join room. Try again.' }
  return { room: updated as OnlinePvPRoom, error: null }
}

export async function joinRoomByToken(
  token: string,
  playerName: string,
  playerId: string
): Promise<{ room: OnlinePvPRoom | null; error: string | null }> {
  const supabase = getSupabaseClient()

  const { data: room, error } = await supabase
    .from('online_pvp_rooms')
    .select('*')
    .eq('share_token', token)
    .single()

  if (error || !room) return { room: null, error: 'Invalid link. Room not found.' }
  return joinRoom(room.code, playerName, playerId)
}

export async function getRoom(code: string): Promise<OnlinePvPRoom | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('online_pvp_rooms')
    .select('*')
    .eq('code', code)
    .single()
  if (error) return null
  return data as OnlinePvPRoom
}

export async function submitArgument(
  code: string,
  playerId: string,
  argument: string,
  room: OnlinePvPRoom
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient()

  const isP1 = room.player1_id === playerId
  const isP2 = room.player2_id === playerId
  if (!isP1 && !isP2) return { error: 'Not a player in this room.' }

  const roundNumber = parseInt(room.status.replace('round', '')) as 1 | 2 | 3

  // If both submitted, merge into rounds array and advance
  const p1Arg = isP1 ? argument : room.p1_submitted
  const p2Arg = isP2 ? argument : room.p2_submitted

  if (p1Arg && p2Arg) {
    // Both submitted — save round and advance
    const newRound: RoomRound = {
      number: roundNumber,
      name: ROUND_NAMES[roundNumber],
      player1Argument: p1Arg,
      player2Argument: p2Arg,
    }
    const updatedRounds = [...room.rounds, newRound]
    const nextStatus = roundNumber === 3 ? 'judging' : `round${roundNumber + 1}` as OnlinePvPRoom['status']

    const { error } = await supabase
      .from('online_pvp_rooms')
      .update({
        rounds: updatedRounds,
        p1_submitted: null,
        p2_submitted: null,
        status: nextStatus,
        current_turn: 'player1',
      })
      .eq('code', code)

    return { error: error?.message ?? null }
  } else {
    // Only one submitted so far — save their arg and wait
    const update = isP1
      ? { p1_submitted: argument, current_turn: 'player2' as const }
      : { p2_submitted: argument, current_turn: 'player1' as const }

    const { error } = await supabase
      .from('online_pvp_rooms')
      .update(update)
      .eq('code', code)

    return { error: error?.message ?? null }
  }
}

// ─── Realtime subscription ────────────────────────────────────

export function subscribeToRoom(
  code: string,
  onUpdate: (room: OnlinePvPRoom) => void
): () => void {
  const supabase = getSupabaseClient()

  const channel = supabase
    .channel(`room:${code}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'online_pvp_rooms', filter: `code=eq.${code}` },
      payload => { onUpdate(payload.new as OnlinePvPRoom) }
    )
    .subscribe()

  // Return unsubscribe function
  return () => { supabase.removeChannel(channel) }
}
