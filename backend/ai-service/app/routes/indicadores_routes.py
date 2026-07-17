from fastapi import APIRouter, HTTPException
from app.schemas.indicadores_schemas import IndicadorRiscoEstoqueRequest

from app.services.indicadores_service import (
    obter_resumo_estoque,
    obter_estoque_por_loja,
    obter_risco_estoque,
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


@router.get("/estoque/risco")
def risco_estoque():
    try:
        return obter_risco_estoque()
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao calcular risco de estoque: {erro}",
        )


@router.post("/estoque/risco")
def risco_estoque_com_contexto(request: IndicadorRiscoEstoqueRequest):
    try:
        return obter_risco_estoque(
            acesso_global=request.acesso_global,
            lojas_ids=request.lojas_ids,
        )
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao calcular risco de estoque com contexto: {erro}",
        )
