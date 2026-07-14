from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
def health_check():
    return {
        "status": "ok",
        "servico": "ai-service",
        "mensagem": "FastAPI funcionando corretamente.",
    }