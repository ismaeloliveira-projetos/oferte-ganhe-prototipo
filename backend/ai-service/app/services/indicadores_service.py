from app.repositories.indicadores_repository import (
    buscar_resumo_estoque,
    listar_estoque_por_loja,
    listar_risco_estoque_por_loja,
)


def obter_resumo_estoque() -> dict:
    resumo = buscar_resumo_estoque()

    return {
        "indicador": "resumo_estoque",
        "descricao": "Resumo geral do estoque de talões por loja.",
        "dados": resumo,
    }


def obter_estoque_por_loja() -> dict:
    lojas = listar_estoque_por_loja()

    return {
        "indicador": "estoque_por_loja",
        "descricao": "Lista de lojas com estoque atual de talões.",
        "total_registros": len(lojas),
        "dados": lojas,
    }


def obter_risco_estoque() -> dict:
    lojas = listar_risco_estoque_por_loja()

    resumo_por_status = {
        "SEM_ESTOQUE_CADASTRADO": 0,
        "CRITICO": 0,
        "ATENCAO": 0,
        "OK": 0,
    }

    for loja in lojas:
        status = loja["status_risco"]
        resumo_por_status[status] += 1

    return {
        "indicador": "risco_estoque",
        "descricao": (
            "Classificação de risco das lojas com base no estoque atual, "
            "quantidade mínima e quantidade recomendada."
        ),
        "total_lojas_analisadas": len(lojas),
        "resumo_por_status": resumo_por_status,
        "dados": lojas,
    }