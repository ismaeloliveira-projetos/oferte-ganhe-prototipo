from app.repositories.indicadores_repository import (
    buscar_resumo_estoque,
    listar_estoque_por_loja,
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