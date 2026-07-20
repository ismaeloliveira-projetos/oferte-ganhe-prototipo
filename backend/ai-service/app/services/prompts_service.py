from app.repositories.ia_repository import (
    criar_nova_versao_prompt,
    listar_prompts_ia,
)
from app.services.logs_service import registrar_log_ia_seguro


def consultar_prompts_ia(
    usuario_id: int,
    acesso_global: bool,
    nome: str | None = None,
    limite: int = 50,
) -> dict:
    if not acesso_global:
        raise PermissionError(
            "Usuário sem permissão para consultar prompts da IA."
        )

    prompts = listar_prompts_ia(
        nome=nome,
        limite=limite,
    )

    return {
        "tipo": "prompts_ia",
        "usuario_id": usuario_id,
        "filtros": {
            "nome": nome,
            "limite": limite,
        },
        "total_registros": len(prompts),
        "dados": prompts,
    }


def criar_versao_prompt_ia(
    usuario_id: int,
    acesso_global: bool,
    nome: str,
    conteudo: str,
    descricao: str | None = None,
) -> dict:
    if not acesso_global:
        raise PermissionError(
            "Usuário sem permissão para criar versão de prompt da IA."
        )

    prompt = criar_nova_versao_prompt(
        nome=nome,
        descricao=descricao,
        conteudo=conteudo,
    )

    registrar_log_ia_seguro(
        nivel="INFO",
        origem="prompts_service.criar_versao_prompt_ia",
        mensagem="Nova versão de prompt da IA criada.",
        metadados={
            "usuario_id": usuario_id,
            "prompt_id": prompt["id"],
            "nome": prompt["nome"],
            "versao": prompt["versao"],
        },
    )

    return {
        "tipo": "prompt_ia",
        "mensagem": "Nova versão de prompt criada com sucesso.",
        "dados": prompt,
    }