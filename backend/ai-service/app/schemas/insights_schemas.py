from typing import Literal
from pydantic import BaseModel, Field


class InsightRiscoEstoqueRequest(BaseModel):
    usuario_id: int | None = None
    acesso_global: bool = False
    lojas_ids: list[int] = Field(default_factory=list)


class HistoricoInsightsRequest(BaseModel):
    usuario_id: int
    limite: int = Field(default=20, ge=1, le=100)


class FeedbackInsightRequest(BaseModel):
    usuario_id: int
    insight_id: int
    avaliacao: Literal["UTIL", "NAO_UTIL", "INCORRETA", "INCOMPLETA"]
    comentario: str | None = None

class InsightAnaliseOperacionalRequest(BaseModel):
    usuario_id: int | None = None 
    acesso_global: bool = False 
    lojas_ids: list[int] = Field(default_factory=list)