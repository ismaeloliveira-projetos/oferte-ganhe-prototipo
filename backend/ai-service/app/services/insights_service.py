import json
import time

from app.repositories.ia_repository import (
    buscar_prompt_ativo_por_nome,
    criar_consulta_ia,
    finalizar_consulta_ia,
    listar_historico_insights_por_usuario,
    registrar_execucao_llm,
    registrar_feedback_resposta,
    registrar_insight,
)
from app.services.indicadores_service import obter_risco_estoque
from app.services.llm_service import chamar_llm
from app.services.logs_service import registrar_log_ia_seguro


def gerar_insight_risco_estoque(
    contexto_usuario: dict | None = None,
    pergunta_usuario: str | None = None,
) -> dict:

    contexto_usuario = contexto_usuario or {}

    usuario_id = contexto_usuario.get("usuario_id")
    acesso_global = contexto_usuario.get("acesso_global", False)
    lojas_ids = contexto_usuario.get("lojas_ids", [])

    consulta_id = criar_consulta_ia(
    tipo_consulta="insight_risco_estoque",
    pergunta=pergunta_usuario or "Gerar insight executivo sobre risco de estoque.",
    usuario_id=usuario_id,
    contexto={
        "origem": "endpoint /insights/estoque/risco",
        "indicador": "risco_estoque",
        "acesso_global": acesso_global,
        "lojas_ids": lojas_ids,
        },
    )
    registrar_log_ia_seguro(
        nivel="INFO",
        origem="insights_service.gerar_insight_risco_estoque",
        mensagem="Consulta de insight de risco de estoque iniciada.",
        metadados={
            "consulta_ia_id": consulta_id,
            "usuario_id": usuario_id,
            "acesso_global": acesso_global,
            "lojas_ids": lojas_ids,
        },
    )

    inicio = time.perf_counter()

    try:
        indicador = obter_risco_estoque(
            acesso_global=acesso_global,
            lojas_ids=lojas_ids,
        )

        dados_compactados = {
            "indicador": indicador["indicador"],
            "descricao": indicador["descricao"],
            "escopo": indicador["escopo"],
            "total_lojas_analisadas": indicador["total_lojas_analisadas"],
            "resumo_por_status": indicador["resumo_por_status"],
            "lojas_prioritarias": [
                {
                    "codigo_loja": loja["codigo_loja"],
                    "nome_loja": loja["nome_loja"],
                    "status_risco": loja["status_risco"],
                    "estoque_atual": loja["estoque_atual"],
                    "quantidade_minima": loja["quantidade_minima"],
                    "quantidade_recomendada": loja["quantidade_recomendada"],
                    "gap_minimo": loja["gap_minimo"],
                    "gap_recomendado": loja["gap_recomendado"],
                }
                for loja in indicador["dados"][:5]
            ],
        }

        prompt = buscar_prompt_ativo_por_nome("insight_risco_estoque")

        if not prompt:
            raise RuntimeError("Prompt ativo 'insight_risco_estoque' não encontrado")

        mensagens = [
            {
                "role": "system",
                "content": (
                    "Você é um analista de operações do sistema Oferte e Ganhe. "
                    "Sua função é explicar indicadores de estoque de forma clara, "
                    "objetiva e executiva. Não invente números. Use somente os dados "
                    "fornecidos. Responda em português do Brasil."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"{prompt['conteudo']}\n\n"
                    "Regras adicionais:\n"
                    "- Responda em no máximo 5 tópicos.\n"
                    "- Cada tópico deve ter no máximo 2 frases.\n"
                    "- Considere que quantidade_minima e quantidade_recomendada são os parâmetros da loja.\n"
                    "- Considere que gap_minimo e gap_recomendado representam quanto falta para atingir esses parâmetros.\n"
                    "- Não confunda gap com quantidade mínima ou recomendada.\n"
                    "- Não invente números.\n"
                    "- Não repita todas as lojas.\n\n"
                    "Dados do indicador:\n"
                    f"{json.dumps(dados_compactados, ensure_ascii=False, indent=2)}"
                ),
            },
        ]

        resposta_llm = chamar_llm(
            mensagens=mensagens,
            temperature=0.2,
            max_tokens=500,
        )

        tempo_ms = int((time.perf_counter() - inicio) * 1000)

        execucao_id = registrar_execucao_llm(
            consulta_ia_id=consulta_id,
            modelo=resposta_llm["modelo"],
            usage=resposta_llm["usage"],
            tempo_ms=tempo_ms,
            status="SUCESSO",
        )

        insight_id = registrar_insight(
            consulta_ia_id=consulta_id,
            tipo_insight="risco_estoque",
            indicador_nome="risco_estoque",
            titulo="Insight executivo de risco de estoque",
            dados_base=dados_compactados,
            resposta=resposta_llm["conteudo"],
            modelo_utilizado=resposta_llm["modelo"],
            nivel_confianca="MEDIO",
        )

        finalizar_consulta_ia(
            consulta_ia_id=consulta_id,
            status="SUCESSO",
        )
        registrar_log_ia_seguro(
            nivel="INFO",
            origem="insights_service.gerar_insight_risco_estoque",
            mensagem="Insight de risco de estoque gerado com sucesso.",
            metadados={
                "consulta_ia_id": consulta_id,
                "execucao_llm_id": execucao_id,
                "insight_id": insight_id,
                "usuario_id": usuario_id,
                "modelo": resposta_llm["modelo"],
                "total_tokens": resposta_llm["usage"].get("total_tokens", 0),
                "custo": resposta_llm["usage"].get("cost", 0),
                "tempo_ms": tempo_ms,
            },
        )

        return {
            "tipo": "insight_risco_estoque",
            "consulta_ia_id": consulta_id,
            "execucao_llm_id": execucao_id,
            "insight_id": insight_id,
            "indicador_base": dados_compactados,
            "insight": resposta_llm["conteudo"],
            "modelo": resposta_llm["modelo"],
            "usage": resposta_llm["usage"],
            "tempo_ms": tempo_ms,
        }

    except Exception as erro:
        tempo_ms = int((time.perf_counter() - inicio) * 1000)

        registrar_execucao_llm(
            consulta_ia_id=consulta_id,
            modelo="desconhecido",
            usage={},
            tempo_ms=tempo_ms,
            status="ERRO",
            erro=str(erro),
        )

        finalizar_consulta_ia(
            consulta_ia_id=consulta_id,
            status="ERRO",
        )
        registrar_log_ia_seguro(
            nivel="ERROR",
            origem="insights_service.gerar_insight_risco_estoque",
            mensagem="Erro ao gerar insight de risco de estoque.",
            metadados={
                "consulta_ia_id": consulta_id,
                "usuario_id": usuario_id,
                "erro": str(erro),
                "tempo_ms": tempo_ms,
            },
        )

        raise


def obter_historico_insights_usuario(
    usuario_id: int,
    limite: int = 20,
) -> dict:
    historico = listar_historico_insights_por_usuario(
        usuario_id=usuario_id,
        limite=limite,
    )

    return {
        "tipo": "historico_insights",
        "usuario_id": usuario_id,
        "total_registros": len(historico),
        "dados": historico,
    }


def registrar_feedback_insight_usuario(
    usuario_id: int,
    insight_id: int,
    avaliacao: str,
    comentario: str | None = None,
) -> dict:
    feedback = registrar_feedback_resposta(
        insight_id=insight_id,
        usuario_id=usuario_id,
        avaliacao=avaliacao,
        comentario=comentario,
    )

    return {
        "tipo": "feedback_insight",
        "mensagem": "Feedback registrado com sucesso.",
        "dados": feedback,
    }
