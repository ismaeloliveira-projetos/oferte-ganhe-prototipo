from fastapi import APIRouter, HTTPException

from app.database.connection import criar_conexao

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


@router.get("/db")
def database_health_check():
    try:
        with criar_conexao() as conexao:
            with conexao.cursor() as cursor:
                cursor.execute("SELECT 1;")
                resultado = cursor.fetchone()

        return {
            "status": "ok",
            "servico": "postgresql",
            "mensagem": "Conexão com PostgreSQL funcionando.",
            "resultado": resultado[0],
        }

    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao conectar ao PostgreSQL: {erro}",
        )