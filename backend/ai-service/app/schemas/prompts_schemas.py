from pydantic import BaseModel, Field


class ListarPromptsRequest(BaseModel):
    usuario_id: int
    acesso_global: bool = False
    nome: str | None = None
    limite: int = Field(default=50, ge=1, le=200)


class CriarVersaoPromptRequest(BaseModel):
    usuario_id: int
    acesso_global: bool = False
    nome: str = Field(min_length=3, max_length=120)
    descricao: str | None = None
    conteudo: str = Field(min_length=20)