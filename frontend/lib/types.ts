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