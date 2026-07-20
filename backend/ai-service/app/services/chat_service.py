from app.services.insights_service import (
    gerar_insight_risco_estoque,
    obter_historico_insights_usuario,
)
from app.services.uso_service import obter_resumo_uso_ia


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

    palavras_historico = [
        "histórico",
        "historico",
        "últimos insights",
        "ultimos insights",
        "insights anteriores",
        "consultas anteriores",
        "respostas anteriores",
        "o que a ia respondeu",
    ]

    palavras_resumo_uso = [
        "uso",
        "resumo",
        "tokens",
        "token",
        "custo",
        "custos",
        "gasto",
        "gastos",
        "tempo médio",
        "tempo medio",
        "feedback",
        "feedbacks",
        "quantas consultas",
        "quantos insights",
    ]

    if any(palavra in mensagem_normalizada for palavra in palavras_historico):
        return "HISTORICO_INSIGHTS"

    if any(palavra in mensagem_normalizada for palavra in palavras_resumo_uso):
        return "RESUMO_USO_IA"

    if any(palavra in mensagem_normalizada for palavra in palavras_estoque):
        return "RISCO_ESTOQUE"

    return "DESCONHECIDA"


def montar_resposta_historico(historico: dict) -> str:
    total = historico["total_registros"]
    dados = historico["dados"]

    if total == 0:
        return "Você ainda não possui insights registrados no histórico."

    ultimos = dados[:5]

    linhas = [
        f"Encontrei {total} registro(s) no seu histórico de insights. "
        "Abaixo estão os mais recentes:"
    ]

    for item in ultimos:
        insight_id = item.get("insight_id")
        tipo_insight = item.get("tipo_insight")
        status = item.get("status_consulta")
        modelo = item.get("modelo")
        total_tokens = item.get("total_tokens")
        custo = item.get("custo")
        criado_em = item.get("insight_criado_em") or item.get("consulta_criada_em")

        linhas.append(
            (
                f"- Insight #{insight_id}: tipo {tipo_insight}, "
                f"status {status}, modelo {modelo}, "
                f"{total_tokens} tokens, custo {custo}, criado em {criado_em}."
            )
        )

    return "\n".join(linhas)


def montar_resposta_resumo_uso(resumo: dict) -> str:
    dados = resumo["dados"]

    total_consultas = dados["total_consultas"]
    consultas_sucesso = dados["consultas_sucesso"]
    consultas_erro = dados["consultas_erro"]
    total_insights = dados["total_insights"]
    total_tokens = dados["tokens"]["total_tokens"]
    custo_total = dados["custo_total"]
    tempo_medio_ms = dados["tempo_medio_ms"]
    feedbacks = dados["feedbacks"]

    return (
        "Resumo do seu uso da IA:\n"
        f"- Consultas realizadas: {total_consultas}\n"
        f"- Consultas com sucesso: {consultas_sucesso}\n"
        f"- Consultas com erro: {consultas_erro}\n"
        f"- Insights gerados: {total_insights}\n"
        f"- Tokens consumidos: {total_tokens}\n"
        f"- Custo total estimado: {custo_total}\n"
        f"- Tempo médio de resposta: {tempo_medio_ms} ms\n"
        f"- Feedbacks: {feedbacks['total']} no total "
        f"({feedbacks['UTIL']} úteis, "
        f"{feedbacks['NAO_UTIL']} não úteis, "
        f"{feedbacks['INCORRETA']} incorretos, "
        f"{feedbacks['INCOMPLETA']} incompletos)."
    )


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

    if intencao == "HISTORICO_INSIGHTS":
        if not usuario_id:
            raise ValueError("Usuário não identificado para consultar histórico.")

        historico = obter_historico_insights_usuario(
            usuario_id=usuario_id,
            limite=5,
        )

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "mensagem_usuario": mensagem,
            "resposta": montar_resposta_historico(historico),
            "dados_referencia": historico,
        }

    if intencao == "RESUMO_USO_IA":
        if not usuario_id:
            raise ValueError("Usuário não identificado para consultar resumo de uso.")

        resumo = obter_resumo_uso_ia(usuario_id=usuario_id)

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "mensagem_usuario": mensagem,
            "resposta": montar_resposta_resumo_uso(resumo),
            "dados_referencia": resumo,
        }

    return {
        "tipo": "chat_ia",
        "intencao": intencao,
        "mensagem_usuario": mensagem,
        "resposta": (
            "Ainda consigo responder perguntas sobre risco de estoque, "
            "histórico de insights e resumo de uso da IA. "
            "Tente perguntar, por exemplo: "
            "'Quais lojas estão com risco de falta de talões?', "
            "'Mostre meu histórico de insights' ou "
            "'Qual foi meu uso da IA?'."
        ),
        "dados_referencia": None,
    }