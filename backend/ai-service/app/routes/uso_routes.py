from fastapi import APIRouter, HTTPException

from app.schemas.uso_schemas import ResumoUsoIaRequest
from app.services.uso_service import obter_resumo_uso_ia

router = APIRouter(
    prefix="/uso",
    tags=["Uso da IA"],
)


@router.post("/resumo")
def resumo_uso_ia(request: ResumoUsoIaRequest):
    try:
        return obter_resumo_uso_ia(usuario_id=request.usuario_id)
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar resumo de uso da IA: {erro}",
        )