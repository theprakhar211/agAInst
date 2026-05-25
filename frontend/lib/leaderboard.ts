// frontend/lib/leaderboard.ts

import { getSupabaseClient } from './supabase'

export type SortBy = 'win_rate' | 'total_wins' | 'avg_score'

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  total_debates: number
  total_wins: number
  win_rate: number
  avg_score: number
}

// Fetch top 100 for the given sort tab
export async function getLeaderboard(sortBy: SortBy = 'win_rate'): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .rpc('get_leaderboard', { sort_by: sortBy, limit_n: 100 })

  if (error) {
    console.error('[leaderboard] fetch failed:', error.message)
    return []
  }

  return (data ?? []).map((row: any) => ({
    rank: Number(row.rank),
    user_id: row.user_id,
    username: row.username ?? 'Anonymous',
    avatar_url: row.avatar_url ?? null,
    total_debates: row.total_debates,
    total_wins: row.total_wins,
    win_rate: Number(row.win_rate),
    avg_score: Number(row.avg_score),
  }))
}

// Find current user's rank for a given sort tab (may be outside top 100)
export async function getMyRank(userId: string, sortBy: SortBy = 'win_rate'): Promise<{
  rank: number
  entry: LeaderboardEntry
} | null> {
  const supabase = getSupabaseClient()

  // Get full leaderboard (limited to 1000 for rank lookup — still fast on a mat view)
  const { data, error } = await supabase
    .rpc('get_leaderboard', { sort_by: sortBy, limit_n: 1000 })

  if (error || !data) return null

  const mine = data.find((row: any) => row.user_id === userId)
  if (!mine) return null

  return {
    rank: Number(mine.rank),
    entry: {
      rank: Number(mine.rank),
      user_id: mine.user_id,
      username: mine.username ?? 'Anonymous',
      avatar_url: mine.avatar_url ?? null,
      total_debates: mine.total_debates,
      total_wins: mine.total_wins,
      win_rate: Number(mine.win_rate),
      avg_score: Number(mine.avg_score),
    }
  }
}
