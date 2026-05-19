# backend/routers/debate.py
from fastapi import APIRouter, HTTPException
from models.schemas import ArgueRequest, ArgueResponse
from services.groq_client import chat
import json
from models.schemas import JudgeRequest, JudgeResponse

router = APIRouter()

DEBATER_PROMPT = """You are arguing the {side} position on: "{topic}".
Your opponent argues the opposite side.
This is round {round} of 3.

Round guide:
- Round 1: Opening — establish your core position clearly
- Round 2: Rebuttal — directly address what the opponent just said
- Round 3: Closing — land your strongest point, summarise your case

Rules:
- Argue with genuine conviction. No strawmen.
- Be concise — under 180 words. Every sentence must earn its place.
- In rounds 2 and 3, directly reference the opponent's previous argument.
- Do not break character or mention you are an AI."""


@router.post("/argue", response_model=ArgueResponse)
def argue(req: ArgueRequest):
    ai_side = "against" if req.user_side == "for" else "for"

    system = DEBATER_PROMPT.format(
        side=ai_side,
        topic=req.topic,
        round=req.round_number
    )

    messages = [{"role": m.role, "content": m.content} for m in req.history]

    try:
        argument = chat(system, messages)
        return ArgueResponse(argument=argument, round_number=req.round_number)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


JUDGE_PROMPT = """You are an impartial debate judge. Evaluate both sides on this debate.

Topic: "{topic}"
User argued: {user_side}
AI argued: {ai_side}

Return ONLY a valid JSON object, no markdown, no explanation. Exactly this structure:
{{
  "winner": "user" or "ai",
  "user_scores": {{"logic": 1-10, "evidence": 1-10, "rebuttal": 1-10, "clarity": 1-10}},
  "ai_scores": {{"logic": 1-10, "evidence": 1-10, "rebuttal": 1-10, "clarity": 1-10}},
  "strongest_argument": "quote or paraphrase the single strongest argument made",
  "reasoning": "2-3 sentences explaining your verdict",
  "fallacies": ["list any logical fallacies detected, or empty array"]
}}"""


@router.post("/judge", response_model=JudgeResponse)
def judge(req: JudgeRequest):
    ai_side = "against" if req.user_side == "for" else "for"
    system = JUDGE_PROMPT.format(
        topic=req.topic,
        user_side=req.user_side,
        ai_side=ai_side
    )
    messages = [{"role": m.role, "content": m.content} for m in req.history]

    for attempt in range(2):   # retry once if JSON parsing fails
        try:
            raw = chat(system, messages, temperature=0.2)
            data = json.loads(raw)
            return JudgeResponse(**data)
        except (json.JSONDecodeError, Exception) as e:
            if attempt == 1:
                raise HTTPException(
                    status_code=500, detail=f"Judge failed: {e}")
