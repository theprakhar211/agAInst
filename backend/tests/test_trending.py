import json
import pytest
from fastapi.testclient import TestClient
from main import app
from routers import debate

GOOD = {"topics": [{"text": f"Topic {i}", "category": "Tech",
                    "difficulty": "Beginner", "why_trending": "x"} for i in range(6)]}


@pytest.fixture(autouse=True)
def _reset(monkeypatch):
    debate.reset_trending_cache()
    debate.limiter.reset()
    monkeypatch.setattr(debate, "TRENDING_RETRY_DELAY", 0)
    yield
    debate.reset_trending_cache()


@pytest.fixture
def client():
    return TestClient(app)


def test_cached_after_first_success(client, monkeypatch):
    calls = []
    monkeypatch.setattr(debate, "chat", lambda *a, **k: calls.append(1) or json.dumps(GOOD))
    for _ in range(5):
        r = client.get("/debate/trending")
        assert r.status_code == 200 and r.json() == GOOD
    assert len(calls) == 1


def test_groq_429_falls_back_without_500_or_leak(client, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("Error code: 429 - org_SECRET rate limit")
    monkeypatch.setattr(debate, "chat", boom)
    r = client.get("/debate/trending")
    assert r.status_code == 200
    assert r.json() == debate.FALLBACK_TOPICS
    assert "org_SECRET" not in r.text


def test_retry_succeeds_on_second_attempt(client, monkeypatch):
    seq = iter([RuntimeError("429"), json.dumps(GOOD)])
    def flaky(*a, **k):
        v = next(seq)
        if isinstance(v, Exception):
            raise v
        return v
    monkeypatch.setattr(debate, "chat", flaky)
    r = client.get("/debate/trending")
    assert r.status_code == 200 and r.json() == GOOD


def test_failure_is_not_retried_for_30s(client, monkeypatch):
    calls = []
    def boom(*a, **k):
        calls.append(1)
        raise RuntimeError("down")
    monkeypatch.setattr(debate, "chat", boom)
    for _ in range(4):
        assert client.get("/debate/trending").status_code == 200
    assert len(calls) == 2  # one request, two attempts; the rest skip the model


def test_stale_cache_served_when_model_fails_later(client, monkeypatch):
    monkeypatch.setattr(debate, "chat", lambda *a, **k: json.dumps(GOOD))
    assert client.get("/debate/trending").json() == GOOD
    debate._trending_cache["ts"] = 0.0  # expire the cache
    monkeypatch.setattr(debate, "chat", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("x")))
    assert client.get("/debate/trending").json() == GOOD


def test_empty_topics_rejected(client, monkeypatch):
    monkeypatch.setattr(debate, "chat", lambda *a, **k: json.dumps({"topics": []}))
    assert client.get("/debate/trending").json() == debate.FALLBACK_TOPICS


def test_prompt_formats_and_forbids_invented_events():
    text = debate.TRENDING_PROMPT.format(year=2026)
    assert "2026" in text and "Do NOT cite specific news events" in text
