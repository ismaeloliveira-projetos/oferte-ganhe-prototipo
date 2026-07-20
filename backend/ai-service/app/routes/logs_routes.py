from fastapi import APIRouter, HTTPException

from app.schemas.logs_schemas import LogsIaRequest
from app.services.logs_consulta_service import consultar_logs_ia

router = APIRouter(
    prefix="/logs",
    tags=["Logs da IA"],
)


@router.post("")
def logs_ia(request: LogsIaRequest):
    try:
        return consultar_logs_ia(
            usuario_id=request.usuario_id,
            acesso_global=request.acesso_global,
            nivel=request.nivel,
            origem=request.origem,
            limite=request.limite,
        )
    except PermissionError as erro:
        raise HTTPException(
            status_code=403,
            detail=str(erro),
        )
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar logs da IA: {erro}",
        )
