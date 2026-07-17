from app.repositories.ia_repository import obter_resumo_uso_ia_por_usuario


def obter_resumo_uso_ia(usuario_id: int) -> dict:
    resumo = obter_resumo_uso_ia_por_usuario(usuario_id)

    return {
        "tipo": "resumo_uso_ia",
        "usuario_id": usuario_id,
        "dados": resumo,
    }