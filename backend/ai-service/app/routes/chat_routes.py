from fastapi import APIRouter, HTTPException

from app.schemas.chat_schemas import ChatIaRequest
from app.services.chat_service import responder_chat_ia

router = APIRouter(
    prefix="/chat",
    tags=["Chat IA"],
)


@router.post("")
def chat_ia(request: ChatIaRequest):
    try:
        return responder_chat_ia(
            usuario_id=request.usuario_id,
            acesso_global=request.acesso_global,
            lojas_ids=request.lojas_ids,
            mensagem=request.mensagem,
        )
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar chat da IA: {erro}",
        )