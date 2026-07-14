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


def listar_risco_estoque_por_loja() -> list[dict]:
    sql = """
        SELECT
            l.id,
            l.codigo_loja,
            l.nome_loja,
            l.quantidade_minima,
            l.quantidade_recomendada,
            COALESCE(e.estoque_atual, 0) AS estoque_atual,
            CASE
                WHEN e.loja_id IS NULL THEN 'SEM_ESTOQUE_CADASTRADO'
                WHEN COALESCE(e.estoque_atual, 0) < l.quantidade_minima THEN 'CRITICO'
                WHEN COALESCE(e.estoque_atual, 0) < l.quantidade_recomendada THEN 'ATENCAO'
                ELSE 'OK'
            END AS status_risco,
            GREATEST(l.quantidade_minima - COALESCE(e.estoque_atual, 0), 0) AS gap_minimo,
            GREATEST(l.quantidade_recomendada - COALESCE(e.estoque_atual, 0), 0) AS gap_recomendado
        FROM lojas l
        LEFT JOIN estoques_lojas e ON e.loja_id = l.id
        WHERE l.ativo = true
        ORDER BY
            CASE
                WHEN e.loja_id IS NULL THEN 1
                WHEN COALESCE(e.estoque_atual, 0) < l.quantidade_minima THEN 2
                WHEN COALESCE(e.estoque_atual, 0) < l.quantidade_recomendada THEN 3
                ELSE 4
            END,
            gap_recomendado DESC,
            l.nome_loja;
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
            "quantidade_minima": linha[3],
            "quantidade_recomendada": linha[4],
            "estoque_atual": linha[5],
            "status_risco": linha[6],
            "gap_minimo": linha[7],
            "gap_recomendado": linha[8],
        }
        for linha in resultados
    ]