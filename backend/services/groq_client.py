# backend/services/groq_client.py
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def chat(system_prompt: str, messages: list[dict], temperature: float = 0.8) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            *messages
        ],
        temperature=temperature,
        max_tokens=600,
    )
    return response.choices[0].message.content
