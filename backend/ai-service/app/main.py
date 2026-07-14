from fastapi import FastAPI

app = FastAPI(
    title="Oferte e Ganhe - AI Service",
    description="Serviço de Inteligência Artificial e Analytics do sistema Oferte e Ganhe",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "mensagem": "Oferte e Ganhe AI Service",
        "status": "online",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "servico": "ai-service",
        "mensagem": "FastAPI funcionando corretamente.",
    }