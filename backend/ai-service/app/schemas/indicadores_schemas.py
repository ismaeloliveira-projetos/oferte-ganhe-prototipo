from pydantic import BaseModel, Field


class IndicadorRiscoEstoqueRequest(BaseModel):
    usuario_id: int | None = None
    acesso_global: bool = False
    lojas_ids: list[int] = Field(default_factory=list)