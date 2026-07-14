from app.database.connection import criar_conexao


def buscar_resumo_estoque() -> dict:
    sql = """
        SELECT
            COUNT(l.id) AS total_lojas,
            COALESCE(SUM(e.estoque_atual), 0) AS estoque_total
        FROM lojas l
        LEFT JOIN estoques_lojas e ON e.loja_id = l.id;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(sql)
            resultado = cursor.fetchone()

    return {
        "total_lojas": resultado[0],
        "estoque_total": resultado[1],
    }


def listar_estoque_por_loja() -> list[dict]:
    sql = """
        SELECT
            l.id,
            l.codigo_loja,
            l.nome_loja,
            COALESCE(e.estoque_atual, 0) AS estoque_atual
        FROM lojas l
        LEFT JOIN estoques_lojas e ON e.loja_id = l.id
        ORDER BY l.nome_loja
        LIMIT 20;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(sql)
            resultados = cursor.fetchall()

    return [
        {
            "loja_id": linha[0],
            "codigo_loja": linha[1],
            "nome_loja": linha[2],
            "estoque_atual": linha[3],
        }
        for linha in resultados
    ]