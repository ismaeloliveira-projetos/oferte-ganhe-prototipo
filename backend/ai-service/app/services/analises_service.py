from datetime import date, timedelta
from math import ceil

from app.repositories.analises_repository import (
    buscar_base_previsao_estoque,
    listar_envios_pendentes_atrasados,
    listar_consumos_fora_do_padrao,
)

DIAS_PROJECAO = 30


def definir_confianca(dias_com_consumo: int) -> str:
    if dias_com_consumo == 0:
        return "SEM_HISTORICO"

    if dias_com_consumo < 3:
        return "BAIXA"

    if dias_com_consumo < 10:
        return "MEDIA"

    return "ALTA"


def calcular_previsao_por_loja(
    loja: dict,
    periodo_dias: int,
) -> dict:
    estoque_atual = float(loja["estoque_atual"])
    quantidade_minima = float(loja["quantidade_minima"])
    total_consumido = float(loja["total_consumido_periodo"])
    dias_com_consumo = int(loja["dias_com_consumo"])

    consumo_medio_diario = total_consumido / periodo_dias

    estoque_estimado_30_dias = estoque_atual - consumo_medio_diario * DIAS_PROJECAO

    dias_ate_estoque_minimo = None
    data_prevista_estoque_minimo = None

    if estoque_atual <= quantidade_minima:
        status_previsao = "JA_CRITICO"
        dias_ate_estoque_minimo = 0
        data_prevista_estoque_minimo = date.today()

    elif consumo_medio_diario == 0:
        status_previsao = "SEM_CONSUMO_REGISTRADO"

    else:
        dias_ate_estoque_minimo = ceil(
            (estoque_atual - quantidade_minima) / consumo_medio_diario
        )

        data_prevista_estoque_minimo = date.today() + timedelta(
            days=dias_ate_estoque_minimo
        )

        if dias_ate_estoque_minimo <= DIAS_PROJECAO:
            status_previsao = "RISCO_EM_30_DIAS"
        else:
            status_previsao = "SEM_RISCO_IMEDIATO"

    return {
        "loja_id": loja["loja_id"],
        "codigo_loja": loja["codigo_loja"],
        "nome_loja": loja["nome_loja"],
        "estoque_atual": estoque_atual,
        "quantidade_minima": quantidade_minima,
        "quantidade_recomendada": float(loja["quantidade_recomendada"]),
        "periodo_analisado_dias": periodo_dias,
        "total_consumido_periodo": total_consumido,
        "dias_com_consumo": dias_com_consumo,
        "ultimo_consumo_em": loja["ultimo_consumo_em"],
        "consumo_medio_diario": round(consumo_medio_diario, 2),
        "estoque_estimado_30_dias": round(estoque_estimado_30_dias, 2),
        "dias_ate_estoque_minimo": dias_ate_estoque_minimo,
        "data_prevista_estoque_minimo": (
            data_prevista_estoque_minimo.isoformat()
            if data_prevista_estoque_minimo
            else None
        ),
        "status_previsao": status_previsao,
        "confianca": definir_confianca(dias_com_consumo),
    }


def obter_analise_preditiva_estoque(
    acesso_global: bool = True,
    lojas_ids: list[int] | None = None,
    periodo_dias: int = 90,
) -> dict:
    lojas_ids = lojas_ids or []

    base_previsao = buscar_base_previsao_estoque(
        acesso_global=acesso_global,
        lojas_ids=lojas_ids,
        periodo_dias=periodo_dias,
    )

    previsoes = [
        calcular_previsao_por_loja(
            loja=loja,
            periodo_dias=periodo_dias,
        )
        for loja in base_previsao
    ]

    resumo_por_status = {
        "JA_CRITICO": 0,
        "RISCO_EM_30_DIAS": 0,
        "SEM_RISCO_IMEDIATO": 0,
        "SEM_CONSUMO_REGISTRADO": 0,
    }

    for previsao in previsoes:
        resumo_por_status[previsao["status_previsao"]] += 1

    return {
        "analise": "previsao_baixa_estoque",
        "descricao": (
            "Previsão de baixa de estoque baseada no consumo real de "
            "talões registrado no período analisado."
        ),
        "escopo": {
            "acesso_global": acesso_global,
            "lojas_ids": lojas_ids,
        },
        "periodo_analisado_dias": periodo_dias,
        "periodo_projecao_dias": DIAS_PROJECAO,
        "total_lojas_analisadas": len(previsoes),
        "resumo_por_status": resumo_por_status,
        "dados": previsoes,
    }


def definir_severidade_envio_atrasado(dias_pendente: int) -> str:
    if dias_pendente >= 7:
        return "ALTA"

    return "MEDIA"

def definir_severidade_consumo_fora_do_padrao(
    fator_acima_media: float,
) -> str:
    if fator_acima_media >= 3:
        return "ALTA"

    return "MEDIA"

def obter_anomalias_operacionais(
    acesso_global: bool = True,
    lojas_ids: list[int] | None = None,
    limite_dias: int = 3,
) -> dict:
    lojas_ids = lojas_ids or []

    envios_atrasados = listar_envios_pendentes_atrasados(
        acesso_global=acesso_global,
        lojas_ids=lojas_ids,
        limite_dias=limite_dias,
    )

    consumos_fora_do_padrao = listar_consumos_fora_do_padrao(
        acesso_global=acesso_global,
        lojas_ids=lojas_ids,
    )

    anomalias_envios = [
        {
            "tipo": "ENVIO_PENDENTE_ATRASADO",
            "severidade": definir_severidade_envio_atrasado(
                envio["dias_pendente"],
            ),
            "titulo": (
                f"Envio {envio['codigo_remessa']} pendente há "
                f"{envio['dias_pendente']} dias."
            ),
            "evidencia": {
                "envio_id": envio["envio_id"],
                "codigo_remessa": envio["codigo_remessa"],
                "loja_id": envio["loja_id"],
                "codigo_loja": envio["codigo_loja"],
                "nome_loja": envio["nome_loja"],
                "quantidade_enviada": float(envio["quantidade_enviada"]),
                "data_envio": envio["data_envio"],
                "dias_pendente": envio["dias_pendente"],
            },
            "recomendacao": (
                "Verificar o status do transporte e confirmar se o "
                "recebimento ainda está pendente."
            ),
        }
        for envio in envios_atrasados
    ]

    anomalias_consumo = [
        {
            "tipo": "CONSUMO_FORA_DO_PADRAO",
            "severidade": definir_severidade_consumo_fora_do_padrao(
                consumo["fator_acima_media"],
            ),
            "titulo": (
                f"Consumo de {consumo['consumo_hoje']:.0f} talões na loja "
                f"{consumo['codigo_loja']} está "
                f"{consumo['fator_acima_media']:.1f}x acima da média."
            ),
            "evidencia": {
                "loja_id": consumo["loja_id"],
                "codigo_loja": consumo["codigo_loja"],
                "nome_loja": consumo["nome_loja"],
                "data_consumo": date.today().isoformat(),
                "consumo_hoje": consumo["consumo_hoje"],
                "consumo_medio_historico": consumo[
                    "consumo_medio_historico"
                ],
                "dias_com_consumo_historico": consumo[
                    "dias_com_consumo_historico"
                ],
                "fator_acima_media": consumo["fator_acima_media"],
            },
            "recomendacao": (
                "Verificar se houve demanda incomum, perda de talões ou "
                "erro no lançamento do consumo."
            ),
        }
        for consumo in consumos_fora_do_padrao
    ]

    anomalias = anomalias_envios + anomalias_consumo

    resumo_por_severidade = {
        "MEDIA": 0,
        "ALTA": 0,
    }

    for anomalia in anomalias:
        resumo_por_severidade[anomalia["severidade"]] += 1

    return {
        "analise": "anomalias_operacionais",
        "descricao": (
            "Identificação de envios de talões pendentes acima do prazo e "
            "de consumos fora do padrão histórico."
        ),
        "escopo": {
            "acesso_global": acesso_global,
            "lojas_ids": lojas_ids,
        },
        "limite_dias_pendente": limite_dias,
        "criterios_consumo_fora_do_padrao": {
            "periodo_historico_dias": 30,
            "minimo_dias_historico": 7,
            "multiplicador_media": 2,
        },
        "total_anomalias": len(anomalias),
        "resumo_por_severidade": resumo_por_severidade,
        "dados": anomalias,
    }
