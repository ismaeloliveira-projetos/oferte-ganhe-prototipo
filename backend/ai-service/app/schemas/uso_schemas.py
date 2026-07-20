from pydantic import BaseModel


class ResumoUsoIaRequest(BaseModel):
    usuario_id: int