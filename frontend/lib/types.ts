// frontend/lib/types.ts
export type Side = "for" | "against"
export type RoundName = "opening" | "rebuttal" | "closing"

export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface Round {
  number: 1 | 2 | 3
  name: RoundName
  userArgument: string
  aiArgument: string
}

export interface DebateSession {
  id: string
  topic: string
  userSide: Side
  rounds: Round[]
  status: "setup" | "debating" | "complete"
  createdAt: number
}


export interface ArgumentAnalysis {
  claim_strength: number
  evidence_quality: number
  emotional_vs_logical: "logical" | "emotional" | "balanced"
  filler_phrases: string[]
  one_liner_feedback: string
  what_ai_noticed: string
}


export interface Round {
  number: 1 | 2 | 3
  name: RoundName
  userArgument: string
  aiArgument: string
  analysis?: ArgumentAnalysis   
}