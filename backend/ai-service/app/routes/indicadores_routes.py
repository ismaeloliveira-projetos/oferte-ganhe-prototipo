from fastapi import APIRouter, HTTPException

from app.services.indicadores_service import (
    obter_resumo_estoque,
    obter_estoque_por_loja,
)

router = APIRouter(
    prefix="/indicadores",
    tags=["Indicadores"],
)


@router.get("/estoque/resumo")
def resumo_estoque():
    try:
        return obter_resumo_estoque()
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar resumo de estoque: {erro}",
        )


@router.get("/estoque/lojas")
def estoque_por_loja():
    try:
        return obter_estoque_por_loja()
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar estoque por loja: {erro}",
        )