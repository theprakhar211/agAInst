import os

# The Groq client is created at import time and needs a key to exist.
# No real call is ever made: every test replaces `routers.debate.chat`.
os.environ.setdefault("GROQ_API_KEY", "test-key")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402
from routers import debate  # noqa: E402


@pytest.fixture
def client():
    debate.limiter.reset()  # every test starts with a clean rate-limit window
    return TestClient(app)


class FakeChat:
    """Stands in for services.groq_client.chat and records every call."""

    def __init__(self):
        self.calls = []
        self.replies = []

    def __call__(self, system, messages, **kwargs):
        self.calls.append(
            {"system": system, "messages": messages, "kwargs": kwargs})
        reply = self.replies.pop(0) if self.replies else "{}"
        if isinstance(reply, Exception):
            raise reply
        return reply


@pytest.fixture
def fake_chat(monkeypatch):
    fake = FakeChat()
    monkeypatch.setattr(debate, "chat", fake)
    return fake


@pytest.fixture(autouse=True)
def _reset_trending_cache():
    debate.reset_trending_cache()
    yield
    debate.reset_trending_cache()
