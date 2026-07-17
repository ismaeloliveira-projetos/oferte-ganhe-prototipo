from typing import Literal

from pydantic import BaseModel, Field


class LogsIaRequest(BaseModel):
    usuario_id: int
    acesso_global: bool = False
    nivel: Literal["DEBUG", "INFO", "WARN", "ERROR"] | None = None
    origem: str | None = None
    limite: int = Field(default=50, ge=1, le=200)
