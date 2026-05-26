# backend/routers/debate.py
from fastapi import APIRouter, HTTPException
from models.schemas import ArgueRequest, ArgueResponse, AnalyseRequest
from services.groq_client import chat
import json
from models.schemas import JudgeRequest, JudgeResponse, PvPJudgeRequest

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

    for attempt in range(2):
        try:
            raw = chat(system, messages, temperature=0.2)
            clean = raw.strip().removeprefix("```json").removeprefix(
                "```").removesuffix("```").strip()
            data = json.loads(clean)
            return JudgeResponse(**data)
        except Exception as e:
            if attempt == 1:
                raise HTTPException(status_code=500, detail=str(e))


ANALYSER_PROMPT = """You are an expert debate coach analysing a single argument.

Topic: "{topic}"
Side being argued: {side}
Round: {round} of 3

Analyse the argument and return ONLY valid JSON, no markdown, no explanation:
{{
  "claim_strength": 1-10,
  "evidence_quality": 1-10,
  "emotional_vs_logical": "logical" | "emotional" | "balanced",
  "filler_phrases": ["list any weak qualifiers found like 'I think maybe', 'sort of', 'probably'"],
  "one_liner_feedback": "one sharp sentence of coaching feedback",
  "what_ai_noticed": "one sentence on what the AI opponent will likely target in rebuttal"
}}"""


@router.post("/analyse")
def analyse(req: AnalyseRequest):
    system = ANALYSER_PROMPT.format(
        topic=req.topic,
        side=req.user_side,
        round=req.round_number
    )
    messages = [{"role": "user", "content": req.argument}]

    for attempt in range(2):
        try:
            raw = chat(system, messages, temperature=0.3)
            clean = raw.strip().removeprefix("```json").removeprefix(
                "```").removesuffix("```").strip()
            data = json.loads(clean)
            return data
        except (json.JSONDecodeError, Exception) as e:
            if attempt == 1:
                raise HTTPException(status_code=500, detail=str(e))


# Fixed structural braces here to stop format string crashes!
PVP_JUDGE_PROMPT = """You are an impartial debate judge evaluating two human debaters.

Topic: "{topic}"
Player 1 ({p1_name}) argued: {p1_side}
Player 2 ({p2_name}) argued: {p2_side}

The winner field must be exactly the name of the winning player — either the string "{p1_name}" or the string "{p2_name}". No other value is valid.

Return ONLY valid JSON, no markdown, no wrapping conversational text. Exactly this structure:
{{
  "winner": "name of the winning player",
  "player1_scores": {{"logic": 1-10, "evidence": 1-10, "rebuttal": 1-10, "clarity": 1-10}},
  "player2_scores": {{"logic": 1-10, "evidence": 1-10, "rebuttal": 1-10, "clarity": 1-10}},
  "strongest_argument": "quote or paraphrase the single strongest argument made",
  "reasoning": "2-3 sentences explaining your verdict",
  "fallacies": ["any logical fallacies detected, or empty array"]
}}"""


@router.post("/pvp/judge")
def pvp_judge(req: PvPJudgeRequest):
    p2_side = "against" if req.p1_side == "for" else "for"

    system = PVP_JUDGE_PROMPT.format(
        topic=req.topic,
        p1_name=req.p1_name,
        p1_side=req.p1_side,
        p2_name=req.p2_name,
        p2_side=p2_side,
    )
    messages = [{"role": m.role, "content": m.content} for m in req.history]

    for attempt in range(2):
        try:
            raw = chat(system, messages, temperature=0.2)
            # Extracted markdown strip cleanup to make it resilient against code fences
            clean = raw.strip().removeprefix("```json").removeprefix(
                "```").removesuffix("```").strip()
            return json.loads(clean)
        except Exception as e:
            if attempt == 1:
                raise HTTPException(status_code=500, detail=str(e))


TRENDING_PROMPT = """You are a debate topic curator. Generate 6 trending, culturally relevant debate topics that people are actively discussing right now in {year}.

Topics should span: Tech, Society, Ethics, Politics, Career, Science.

Return ONLY valid JSON, no markdown:
{{
  "topics": [
    {{"text": "topic here", "category": "Tech", "difficulty": "Intermediate", "why_trending": "one sentence reason"}},
    ...
  ]
}}

Make them specific and debatable — not vague. Good: "Elon Musk's leadership is hurting Tesla". Bad: "Is technology good?".
Difficulty: Beginner (clear sides), Intermediate (nuanced), Hard (deeply contested)."""


@router.get("/trending")
def trending_topics():
    from datetime import datetime
    system = TRENDING_PROMPT.format(year=datetime.now().year)
    messages = [
        {"role": "user", "content": "Give me 6 trending debate topics for right now."}]

    for attempt in range(2):
        try:
            raw = chat(system, messages, temperature=0.9)
            clean = raw.strip().removeprefix("```json").removeprefix(
                "```").removesuffix("```").strip()
            data = json.loads(clean)
            return data
        except Exception as e:
            if attempt == 1:
                raise HTTPException(status_code=500, detail=str(e))