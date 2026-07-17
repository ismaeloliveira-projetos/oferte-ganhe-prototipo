from app.services.insights_service import gerar_insight_risco_estoque


def identificar_intencao_chat(mensagem: str) -> str:
    mensagem_normalizada = mensagem.lower()

    palavras_estoque = [
        "estoque",
        "talão",
        "talao",
        "talões",
        "taloes",
        "risco",
        "falta",
        "reposição",
        "reposicao",
        "loja",
        "lojas",
    ]

    if any(palavra in mensagem_normalizada for palavra in palavras_estoque):
        return "RISCO_ESTOQUE"

    return "DESCONHECIDA"


def responder_chat_ia(
    usuario_id: int | None,
    acesso_global: bool,
    lojas_ids: list[int],
    mensagem: str,
) -> dict:
    intencao = identificar_intencao_chat(mensagem)

    contexto_usuario = {
        "usuario_id": usuario_id,
        "acesso_global": acesso_global,
        "lojas_ids": lojas_ids,
    }

    if intencao == "RISCO_ESTOQUE":
        resultado = gerar_insight_risco_estoque(
            contexto_usuario=contexto_usuario,
            pergunta_usuario=mensagem,
        )

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "mensagem_usuario": mensagem,
            "resposta": resultado["insight"],
            "dados_referencia": {
                "consulta_ia_id": resultado["consulta_ia_id"],
                "execucao_llm_id": resultado["execucao_llm_id"],
                "insight_id": resultado["insight_id"],
                "indicador": resultado["indicador_base"]["indicador"],
                "total_lojas_analisadas": resultado["indicador_base"]["total_lojas_analisadas"],
                "resumo_por_status": resultado["indicador_base"]["resumo_por_status"],
                "modelo": resultado["modelo"],
                "usage": resultado["usage"],
                "tempo_ms": resultado["tempo_ms"],
            },
        }

    return {
        "tipo": "chat_ia",
        "intencao": intencao,
        "mensagem_usuario": mensagem,
        "resposta": (
            "Ainda consigo responder apenas perguntas sobre risco de estoque "
            "e reposição de talões. Tente perguntar, por exemplo: "
            "'Quais lojas estão com risco de falta de talões?'"
        ),
        "dados_referencia": None,
    }