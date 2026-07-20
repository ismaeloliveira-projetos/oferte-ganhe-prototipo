from app.services.insights_service import (
    gerar_insight_risco_estoque,
    obter_historico_insights_usuario,
)
from app.services.uso_service import obter_resumo_uso_ia
from app.services.indicadores_service import obter_risco_estoque
import unicodedata


def identificar_intencao_chat(mensagem):
    texto = normalizar_texto_chat(mensagem)

    if contem_algum(
        texto,
        [
            "sem estoque cadastrado",
            "sem cadastro de estoque",
            "estoque nao cadastrado",
            "lojas sem estoque",
            "loja sem estoque",
            "sem estoque",
        ],
    ):
        return "LOJAS_SEM_ESTOQUE_CADASTRADO"

    if contem_algum(
        texto,
        [
            "lojas criticas",
            "loja critica",
            "em critico",
            "situacao critica",
            "estoque critico",
            "criticas",
            "critica",
        ],
    ):
        return "LOJAS_CRITICAS"

    if contem_algum(
        texto,
        [
            "maior falta",
            "maiores faltas",
            "maior gap",
            "maiores gaps",
            "mais reposicao",
            "precisam de reposicao",
            "precisa de reposicao",
            "necessidade de reposicao",
            "maior necessidade",
            "maiores necessidades",
            "falta para recomendado",
        ],
    ):
        return "MAIORES_GAPS_REPOSICAO"

    if contem_algum(
        texto,
        [
            "historico",
            "ultimos insights",
            "insights recentes",
            "meus insights",
        ],
    ):
        return "HISTORICO_INSIGHTS"

    if contem_algum(
        texto,
        [
            "uso da ia",
            "tokens",
            "custo",
            "gasto",
            "quanto gastei",
            "consumo da ia",
        ],
    ):
        return "RESUMO_USO_IA"

    if contem_algum(
        texto,
        [
            "risco",
            "estoque",
            "taloes",
            "talao",
        ],
    ):
        return "RISCO_ESTOQUE"

    return "DESCONHECIDA"

def normalizar_texto_chat(texto: str) -> str:
    texto = texto or ""
    texto = texto.lower()

    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(
        caractere
        for caractere in texto
        if unicodedata.category(caractere) != "Mn"
    )

    return texto


def contem_algum(texto: str, termos: list[str]) -> bool:
    return any(termo in texto for termo in termos)


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

    if intencao == "LOJAS_CRITICAS":
        contexto = obter_contexto_basico(contexto_usuario)

        indicador = obter_risco_estoque(
            acesso_global=contexto["acesso_global"],
            lojas_ids=contexto["lojas_ids"],
        )

        lojas_criticas = [
            loja
            for loja in indicador.get("dados", [])
            if loja.get("status_risco") == "CRITICO"
        ]

        lojas_criticas = sorted(
            lojas_criticas,
            key=lambda loja: loja.get("gap_recomendado") or 0,
            reverse=True,
        )

        if not lojas_criticas:
            resposta = "Não encontrei lojas críticas dentro do seu escopo atual."
        else:
            top_lojas = lojas_criticas[:5]

            linhas = "\n".join(formatar_linha_loja_risco(loja) for loja in top_lojas)

            resposta = (
                f"Encontrei {len(lojas_criticas)} loja(s) críticas "
                f"dentro do seu escopo. Prioridades:\n\n{linhas}"
            )

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "resposta": resposta,
            "dados_referencia": {
                "indicador": "risco_estoque",
                "total": len(lojas_criticas),
            },
        }
    if intencao == "LOJAS_SEM_ESTOQUE_CADASTRADO":
        contexto = obter_contexto_basico(contexto_usuario)

        indicador = obter_risco_estoque(
            acesso_global=contexto["acesso_global"],
            lojas_ids=contexto["lojas_ids"],
        )

        lojas_sem_estoque = [
            loja
            for loja in indicador.get("dados", [])
            if loja.get("status_risco") == "SEM_ESTOQUE_CADASTRADO"
        ]

        if not lojas_sem_estoque:
            resposta = (
                "Não encontrei lojas sem estoque cadastrado dentro do seu escopo."
            )
        else:
            top_lojas = lojas_sem_estoque[:5]

            linhas = "\n".join(formatar_linha_loja_risco(loja) for loja in top_lojas)

            resposta = (
                f"Encontrei {len(lojas_sem_estoque)} loja(s) sem estoque cadastrado. "
                f"Primeiras ocorrências:\n\n{linhas}"
            )

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "resposta": resposta,
            "dados_referencia": {
                "indicador": "risco_estoque",
                "total": len(lojas_sem_estoque),
            },
        }
    if intencao == "MAIORES_GAPS_REPOSICAO":
        contexto = obter_contexto_basico(contexto_usuario)

        indicador = obter_risco_estoque(
            acesso_global=contexto["acesso_global"],
            lojas_ids=contexto["lojas_ids"],
        )

        lojas_com_gap = [
            loja
            for loja in indicador.get("dados", [])
            if (loja.get("gap_recomendado") or 0) > 0
        ]

        lojas_com_gap = sorted(
            lojas_com_gap,
            key=lambda loja: loja.get("gap_recomendado") or 0,
            reverse=True,
        )

        if not lojas_com_gap:
            resposta = "Não encontrei lojas com falta para o estoque recomendado dentro do seu escopo."
        else:
            top_lojas = lojas_com_gap[:5]

            linhas = "\n".join(formatar_linha_loja_risco(loja) for loja in top_lojas)

            resposta = (
                "As lojas com maior necessidade de reposição são:\n\n" f"{linhas}"
            )

            

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "resposta": resposta,
            "dados_referencia": {
                "indicador": "risco_estoque",
                "total": len(lojas_com_gap),
            },
        }
    if intencao == "RISCO_ESTOQUE":
        resultado = gerar_insight_risco_estoque(
            contexto_usuario=contexto_usuario,
            pergunta_usuario=mensagem,
        )

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "resposta": resultado.get("insight")
            or resultado.get("resposta")
            or "Insight de risco de estoque gerado com sucesso.",
            "dados_referencia": resultado,
        }

    if intencao == "HISTORICO_INSIGHTS":
        historico = obter_historico_insights_usuario(
            usuario_id=usuario_id,
            limite=5,
        )

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "resposta": montar_resposta_historico(historico),
            "dados_referencia": historico,
        }

    if intencao == "RESUMO_USO_IA":
        resumo = obter_resumo_uso_ia(usuario_id=usuario_id)

        return {
            "tipo": "chat_ia",
            "intencao": intencao,
            "resposta": montar_resposta_resumo_uso(resumo),
            "dados_referencia": resumo,
        }

    return {
        "tipo": "chat_ia",
        "intencao": "DESCONHECIDA",
        "resposta": (
            "Ainda não sei responder esse tipo de pergunta. "
            "Você pode perguntar sobre lojas críticas, lojas sem estoque cadastrado, "
            "maiores necessidades de reposição, risco de estoque, histórico de insights "
            "ou uso da IA."
        ),
        "dados_referencia": None,
    }


def formatar_linha_loja_risco(loja):
    codigo = loja.get("codigo_loja") or "-"
    nome = loja.get("nome_loja") or "Loja sem nome"
    estoque_atual = loja.get("estoque_atual") or 0
    recomendado = loja.get("quantidade_recomendada") or 0
    gap = loja.get("gap_recomendado") or 0

    return (
        f"- {codigo} - {nome}: "
        f"estoque atual {estoque_atual}, "
        f"recomendado {recomendado}, "
        f"falta {gap} talões."
    )


def obter_contexto_basico(contexto_usuario):
    contexto_usuario = contexto_usuario or {}

    return {
        "usuario_id": contexto_usuario.get("usuario_id"),
        "acesso_global": contexto_usuario.get("acesso_global", False),
        "lojas_ids": contexto_usuario.get("lojas_ids") or [],
    }
