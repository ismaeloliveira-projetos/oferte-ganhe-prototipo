from fastapi import APIRouter, HTTPException

from app.schemas.prompts_schemas import (
    CriarVersaoPromptRequest,
    ListarPromptsRequest,
)
from app.services.prompts_service import (
    consultar_prompts_ia,
    criar_versao_prompt_ia,
)

router = APIRouter(
    prefix="/prompts",
    tags=["Prompts IA"],
)


@router.post("/listar")
def listar_prompts(request: ListarPromptsRequest):
    try:
        return consultar_prompts_ia(
            usuario_id=request.usuario_id,
            acesso_global=request.acesso_global,
            nome=request.nome,
            limite=request.limite,
        )
    except PermissionError as erro:
        raise HTTPException(status_code=403, detail=str(erro))
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar prompts da IA: {erro}",
        )


@router.post("/versao")
def criar_versao_prompt(request: CriarVersaoPromptRequest):
    try:
        return criar_versao_prompt_ia(
            usuario_id=request.usuario_id,
            acesso_global=request.acesso_global,
            nome=request.nome,
            descricao=request.descricao,
            conteudo=request.conteudo,
        )
    except PermissionError as erro:
        raise HTTPException(status_code=403, detail=str(erro))
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar versão de prompt da IA: {erro}",
        )