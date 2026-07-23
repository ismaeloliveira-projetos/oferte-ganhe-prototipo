from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.config import settings

from app.routes.health_routes import router as health_router
from app.routes.indicadores_routes import router as indicadores_router
from app.routes.insights_routes import router as insights_router
from app.routes.uso_routes import router as uso_router
from app.routes.logs_routes import router as logs_router
from app.routes.chat_routes import router as chat_router
from app.routes.prompts_routes import router as prompts_router
from app.routes.relatorios_routes import router as relatorios_router

app = FastAPI(
    title="Oferte e Ganhe - AI Service",
    description="Serviço de Inteligência Artificial e Analytics do sistema Oferte e Ganhe",
    version="0.1.0",
)

# /health, /docs e /openapi.json continuam públicos
#todas as rotas reais da IA exigem x-ai-internal-key
#se não mandar a chave, retorna 401 
ROTAS_PUBLICAS = {
    "/",
    "/health",
    "/health/db",
    "/docs",
    "/redoc",
    "/openapi.json",
}


@app.middleware("http")
async def validar_chave_interna_ia(request: Request, call_next):
    caminho = request.url.path

    if request.method == "OPTIONS":
        return await call_next(request)

    if caminho in ROTAS_PUBLICAS:
        return await call_next(request)

    if caminho.startswith("/docs"):
        return await call_next(request)

    if not settings.ia_internal_api_key:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "IA_INTERNAL_API_KEY não configurada no serviço de IA."
            },
        )

    chave_recebida = request.headers.get("x-ai-internal-key")

    if chave_recebida != settings.ia_internal_api_key:
        return JSONResponse(
            status_code=401,
            content={
                "detail": "Chave interna inválida ou ausente para acessar o serviço de IA."
            },
        )

    return await call_next(request)


app.include_router(health_router)
app.include_router(indicadores_router)
app.include_router(insights_router)
app.include_router(uso_router)
app.include_router(logs_router)
app.include_router(chat_router)
app.include_router(prompts_router)
app.include_router(relatorios_router)


@app.get("/")
def root():
    return {
        "mensagem": "Oferte e Ganhe AI Service",
        "status": "online",
    }
