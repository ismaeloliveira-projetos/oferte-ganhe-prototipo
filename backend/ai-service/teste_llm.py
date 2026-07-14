import os
import sys
from typing import Any

import requests
from dotenv import load_dotenv


OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def carregar_configuracoes() -> tuple[str, str]:
    load_dotenv()

    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "openrouter/auto")

    if not api_key:
        print("Erro: OPENROUTER_API_KEY não encontrada no .env.")
        sys.exit(1)

    return api_key, model


def criar_payload(model: str) -> dict[str, Any]:
    return {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Você é um assistente de análise do sistema Oferte e Ganhe. "
                    "Responda em português do Brasil, com clareza e objetividade."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Explique em uma frase como a IA pode ajudar "
                    "na gestão do estoque de talões."
                ),
            },
        ],
        "temperature": 0.2,
        "max_tokens": 200,
    }


def chamar_llm(api_key: str, model: str) -> dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-OpenRouter-Title": "Oferte e Ganhe",
    }

    resposta = requests.post(
        OPENROUTER_API_URL,
        headers=headers,
        json=criar_payload(model),
        timeout=60,
    )

    try:
        dados = resposta.json()
    except Exception as erro:
        raise RuntimeError(
            f"Resposta inválida da API. Status HTTP: {resposta.status_code}"
        ) from erro

    if not resposta.ok:
        mensagem = dados.get("error", {}).get("message", "Erro não especificado.")
        raise RuntimeError(f"Erro HTTP {resposta.status_code}: {mensagem}")

    return dados


def main() -> None:
    api_key, model = carregar_configuracoes()

    try:
        dados = chamar_llm(api_key, model)

        conteudo = dados.get("choices", [{}])[0].get("message", {}).get("content")
        usage = dados.get("usage", {})

        if not conteudo:
            raise RuntimeError("A API respondeu sem conteúdo textual.")

        print("API conectada com sucesso!")
        print()
        print(conteudo)
        print()
        print(f"Modelo: {dados.get('model', model)}")
        print(f"Tokens totais: {usage.get('total_tokens', 'não informado')}")

    except Exception as erro:
        print(f"Falha no teste: {erro}")
        sys.exit(1)


if __name__ == "__main__":
    main()