from app.repositories.ia_repository import registrar_log_ia


def registrar_log_ia_seguro(
    nivel: str,
    origem: str,
    mensagem: str,
    metadados: dict | None = None,
) -> int | None:
    try:
        return registrar_log_ia(
            nivel=nivel,
            origem=origem,
            mensagem=mensagem,
            metadados=metadados,
        )
    except Exception:
        return None