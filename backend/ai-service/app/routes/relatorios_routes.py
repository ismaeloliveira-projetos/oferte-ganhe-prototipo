from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.relatorios_export_service import (
    gerar_csv_relatorio,
    gerar_nome_arquivo,
)

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])


class ExportarRelatorioRequest(BaseModel):
    tipo: str
    dados: list[dict]


@router.post("/exportar/csv")
def exportar_relatorio_csv(payload: ExportarRelatorioRequest):
    try:
        conteudo_csv = gerar_csv_relatorio(
            tipo=payload.tipo,
            dados=payload.dados,
        )

        nome_arquivo = gerar_nome_arquivo(payload.tipo)

        headers = {
            "Content-Disposition": f'attachment; filename="{nome_arquivo}"'
        }

        return Response(
            content=conteudo_csv,
            media_type="text/csv; charset=utf-8",
            headers=headers,
        )

    except ValueError as erro:
        raise HTTPException(status_code=400, detail=str(erro))