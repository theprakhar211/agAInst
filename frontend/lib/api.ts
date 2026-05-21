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
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => "No error body details")
    console.error(`❌ Argue Request Failed (${res.status}):`, errorText)
    throw new Error("Argue request failed")
  }
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
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => "No error body details")
    console.error(`❌ Judge Request Failed (${res.status}):`, errorText)
    throw new Error("Judge request failed")
  }
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
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => "No error body details")
    console.error(`❌ Analyse Request Failed (${res.status}):`, errorText)
    throw new Error("Analyse request failed")
  }
  return res.json()
}

export async function pvpJudge(payload: {
  topic: string
  p1_name: string
  p2_name: string
  p1_side: "for" | "against"
  history: { role: "user" | "assistant"; content: string }[]
}) {
  const res = await fetch(`${BASE_URL}/debate/pvp/judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => "No error body details")
    console.error(`❌ PvP Judge Request Failed (${res.status}):`, errorText)
    throw new Error("PvP judge request failed")
  }
  return res.json()
}