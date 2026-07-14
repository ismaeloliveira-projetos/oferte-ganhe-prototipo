from typing import Any

import requests

from app.core.config import settings


OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def chamar_llm(
    mensagens: list[dict[str, str]],
    temperature: float = 0.2,
    max_tokens: int = 500,
) -> dict[str, Any]:
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY não configurada no .env.")

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-OpenRouter-Title": "Oferte e Ganhe",
    }

    payload = {
        "model": settings.openrouter_model,
        "messages": mensagens,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    resposta = requests.post(
        OPENROUTER_API_URL,
        headers=headers,
        json=payload,
        timeout=60,
    )

    try:
        dados = resposta.json()
    except Exception as erro:
        raise RuntimeError(
            f"Resposta inválida da OpenRouter. Status HTTP: {resposta.status_code}"
        ) from erro

    if not resposta.ok:
        mensagem = dados.get("error", {}).get("message", "Erro não especificado.")
        raise RuntimeError(f"Erro OpenRouter {resposta.status_code}: {mensagem}")

    conteudo = dados.get("choices", [{}])[0].get("message", {}).get("content")

    if not conteudo:
        raise RuntimeError("A OpenRouter respondeu sem conteúdo textual.")

    return {
        "conteudo": conteudo,
        "modelo": dados.get("model", settings.openrouter_model),
        "usage": dados.get("usage", {}),
    }