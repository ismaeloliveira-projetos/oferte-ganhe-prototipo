from pydantic import BaseModel, Field


class AnalisePreditivaEstoqueRequest(BaseModel):
    usuario_id: int | None = None
    acesso_global: bool = False
    lojas_ids: list[int] = Field(default_factory=list)
    periodo_dias: int = Field(default=90, ge=30, le=365)

class AnomaliasOperacionaisRequest(BaseModel):
    usuario_id: int | None = None
    acesso_global: bool = False
    lojas_ids: list[int] = Field(default_factory=list)
    limite_dias: int = Field(default=3, ge=1, le=30)