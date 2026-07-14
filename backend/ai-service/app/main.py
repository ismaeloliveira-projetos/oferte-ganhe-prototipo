from fastapi import FastAPI

from app.routes.health_routes import router as health_router
from app.routes.indicadores_routes import router as indicadores_router

app = FastAPI(
    title="Oferte e Ganhe - AI Service",
    description="Serviço de Inteligência Artificial e Analytics do sistema Oferte e Ganhe",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(indicadores_router)

@app.get("/")
def root():
    return {
        "mensagem": "Oferte e Ganhe AI Service",
        "status": "online",
    }