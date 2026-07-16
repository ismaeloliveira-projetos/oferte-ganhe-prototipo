from fastapi import APIRouter, HTTPException

from app.schemas.insights_schemas import InsightRiscoEstoqueRequest
from app.services.insights_service import gerar_insight_risco_estoque

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
        return gerar_insight_risco_estoque(
            contexto_usuario=request.model_dump()
        )
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar insight de risco de estoque: {erro}",
        )