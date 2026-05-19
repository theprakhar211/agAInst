# backend/models/schemas.py
from pydantic import BaseModel
from typing import Literal


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ArgueRequest(BaseModel):
    topic: str
    user_side: Literal["for", "against"]
    round_number: int           # 1, 2, or 3
    history: list[Message]      # full conversation so far


class ArgueResponse(BaseModel):
    argument: str
    round_number: int


class JudgeRequest(BaseModel):
    topic: str
    user_side: Literal["for", "against"]
    history: list[Message]      # complete 3-round transcript


class Score(BaseModel):
    logic: int
    evidence: int
    rebuttal: int
    clarity: int


class JudgeResponse(BaseModel):
    winner: Literal["user", "ai"]
    user_scores: Score
    ai_scores: Score
    strongest_argument: str
    reasoning: str
    fallacies: list[str]


class AnalyseRequest(BaseModel):
    topic: str
    user_side: Literal["for", "against"]
    round_number: int
    argument: str
