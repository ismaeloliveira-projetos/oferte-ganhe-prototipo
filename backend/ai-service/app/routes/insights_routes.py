from fastapi import APIRouter, HTTPException

from app.schemas.insights_schemas import (
    HistoricoInsightsRequest,
    InsightRiscoEstoqueRequest,
)
from app.services.insights_service import (
    gerar_insight_risco_estoque,
    obter_historico_insights_usuario,
)

router = APIRouter(
    prefix="/insights",
    tags=["Insights"],
)


@router.get("/estoque/risco")
def insight_risco_estoque_get():
    try:
        return gerar_insight_risco_estoque()
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar insight de risco de estoque: {erro}",
        )


@router.post("/estoque/risco")
def insight_risco_estoque_post(request: InsightRiscoEstoqueRequest):
    try:
        return gerar_insight_risco_estoque(contexto_usuario=request.model_dump())
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar insight de risco de estoque: {erro}",
        )


@router.post("/historico")
def historico_insights(request: HistoricoInsightsRequest):
    try:
        return obter_historico_insights_usuario(
            usuario_id=request.usuario_id,
            limite=request.limite,
        )
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar histórico de insights: {erro}",
        )
