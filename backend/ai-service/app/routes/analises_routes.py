from fastapi import APIRouter, HTTPException

from app.schemas.analises_schemas import (
    AnalisePreditivaEstoqueRequest,
    AnomaliasOperacionaisRequest,
)

from app.services.analises_service import (
    obter_analise_preditiva_estoque,
    obter_anomalias_operacionais,
)

router = APIRouter(
    prefix="/analises",
    tags=["Análises preditivas"],
)


@router.post("/estoque/previsao")
def previsao_estoque(request: AnalisePreditivaEstoqueRequest):
    try:
        return obter_analise_preditiva_estoque(
            acesso_global=request.acesso_global,
            lojas_ids=request.lojas_ids,
            periodo_dias=request.periodo_dias,
        )
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar previsão de estoque: {erro}",
        )


@router.post("/envios/anomalias")
def anomalias_envios(request: AnomaliasOperacionaisRequest):
    try:
        return obter_anomalias_operacionais(
            acesso_global=request.acesso_global,
            lojas_ids=request.lojas_ids,
            limite_dias=request.limite_dias,
        )
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao identificar anomalias de envios: {erro}",
        )
