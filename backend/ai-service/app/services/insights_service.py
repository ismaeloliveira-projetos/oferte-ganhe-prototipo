import json
import time

from app.repositories.ia_repository import (
    criar_consulta_ia,
    finalizar_consulta_ia,
    registrar_execucao_llm,
    registrar_insight,
)
from app.services.indicadores_service import obter_risco_estoque
from app.services.llm_service import chamar_llm


def gerar_insight_risco_estoque() -> dict:
    consulta_id = criar_consulta_ia(
        tipo_consulta="insight_risco_estoque",
        pergunta="Gerar insight executivo sobre risco de estoque.",
        contexto={
            "origem": "endpoint /insights/estoque/risco",
            "indicador": "risco_estoque",
        },
    )

    inicio = time.perf_counter()

    try:
        indicador = obter_risco_estoque()

        dados_compactados = {
            "indicador": indicador["indicador"],
            "descricao": indicador["descricao"],
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
                    "Analise o indicador de risco de estoque abaixo e gere um insight "
                    "executivo curto, em no máximo 5 tópicos. "
                    "Cada tópico deve ter no máximo 2 frases. "
                    "Fale apenas sobre resumo geral, riscos principais e ação recomendada. "
                    "Considere que quantidade_minima e quantidade_recomendada são os parâmetros da loja. "
                    "Considere que gap_minimo e gap_recomendado representam quanto falta para atingir esses parâmetros. "
                    "Não confunda gap com quantidade mínima ou recomendada. "
                    "Não invente números. Não repita todas as lojas.\n\n"
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

        raise