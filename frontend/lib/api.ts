const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function argue(payload: {
  topic: string
  user_side: "for" | "against"
  round_number: number
  history: { role: "user" | "assistant"; content: string }[]
}) {
  const res = await fetch(`${BASE_URL}/debate/argue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Argue request failed")
  return res.json()
}

export async function judge(payload: {
  topic: string
  user_side: "for" | "against"
  history: { role: "user" | "assistant"; content: string }[]
}) {
  const res = await fetch(`${BASE_URL}/debate/judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Judge request failed")
  return res.json()
}

export async function analyse(payload: {
  topic: string
  user_side: "for" | "against"
  round_number: number
  argument: string
}) {
  const res = await fetch(`${BASE_URL}/debate/analyse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Analyse request failed")
  return res.json()
}