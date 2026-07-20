from app.repositories.ia_repository import listar_logs_ia


def consultar_logs_ia(
    usuario_id: int,
    acesso_global: bool,
    nivel: str | None = None,
    origem: str | None = None,
    limite: int = 50,
) -> dict:
    if not acesso_global:
        raise PermissionError(
            "Usuário sem permissão para consultar logs técnicos da IA."
        )

    logs = listar_logs_ia(
        nivel=nivel,
        origem=origem,
        limite=limite,
    )

    return {
        "tipo": "logs_ia",
        "usuario_id": usuario_id,
        "filtros": {
            "nivel": nivel,
            "origem": origem,
            "limite": limite,
        },
        "total_registros": len(logs),
        "dados": logs,
    }
