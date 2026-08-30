"""Thin wrapper around Groq's OpenAI-compatible chat completions API.

Handles the defensive-parsing requirements from the spec: strips markdown
code fences the model sometimes wraps JSON in, retries once on invalid
JSON, and raises a typed error if it still can't get valid JSON back.
"""

import json
import re

import httpx

from app.config import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


class AIConfigError(Exception):
    """Raised when GROQ_API_KEY isn't configured."""


class AIRequestError(Exception):
    """Raised when the Groq API call itself fails (network/HTTP error)."""


class AIParsingError(Exception):
    """Raised when the model's response still isn't valid JSON after a retry."""


def _strip_fences(text: str) -> str:
    return _FENCE_RE.sub("", text.strip()).strip()


async def _call(messages: list[dict]) -> str:
    if not settings.groq_api_key:
        raise AIConfigError("GROQ_API_KEY is not configured")

    payload = {
        "model": settings.groq_model,
        "messages": messages,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(GROQ_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        raise AIRequestError(f"Could not reach Groq API: {exc}") from exc

    if resp.status_code != 200:
        raise AIRequestError(f"Groq API returned {resp.status_code}: {resp.text[:500]}")

    body = resp.json()
    try:
        return body["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise AIRequestError(f"Unexpected Groq API response shape: {body}") from exc


async def chat_completion_json(system_prompt: str, messages: list[dict]) -> dict:
    """Calls Groq with a system prompt + message history, expecting a JSON
    object back. Retries once (with a stricter reminder) if the first
    response isn't valid JSON."""
    full_messages = [{"role": "system", "content": system_prompt}, *messages]

    content = await _call(full_messages)
    try:
        return json.loads(_strip_fences(content))
    except json.JSONDecodeError:
        pass

    retry_messages = full_messages + [
        {"role": "assistant", "content": content},
        {"role": "user", "content": "That was not valid JSON. Respond again with ONLY a single valid JSON object, no markdown fences, no extra commentary."},
    ]
    content = await _call(retry_messages)
    try:
        return json.loads(_strip_fences(content))
    except json.JSONDecodeError as exc:
        raise AIParsingError("AI response was not valid JSON after one retry") from exc
