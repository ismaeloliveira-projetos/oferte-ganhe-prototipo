from app.database.connection import criar_conexao


def buscar_base_previsao_estoque(
    acesso_global: bool = True,
    lojas_ids: list[int] | None = None,
    periodo_dias: int = 90,
) -> list[dict]:
    lojas_ids = lojas_ids or []

    sql = """
        SELECT
            l.id,
            l.codigo_loja,
            l.nome_loja,
            e.estoque_atual,
            l.quantidade_minima,
            l.quantidade_recomendada,

            COALESCE(SUM(c.quantidade), 0) AS total_consumido_periodo,

            COUNT(DISTINCT c.data_consumo) AS dias_com_consumo,

            MAX(c.data_consumo) AS ultimo_consumo_em

        FROM lojas l

        INNER JOIN estoques_lojas e
            ON e.loja_id = l.id

        LEFT JOIN consumos_taloes c
             ON c.loja_id = l.id
            AND c.data_consumo >= CURRENT_DATE - %s
           

        WHERE l.ativo = true
          AND (
              %s = true
              OR l.id = ANY(%s::int[])
          )

        GROUP BY
            l.id,
            l.codigo_loja,
            l.nome_loja,
            e.estoque_atual,
            l.quantidade_minima,
            l.quantidade_recomendada

        ORDER BY l.nome_loja;
    """

    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(
                sql,
                (periodo_dias, acesso_global, lojas_ids),
            )
            resultados = cursor.fetchall()
        return [
            {
                "loja_id": linha[0],
                "codigo_loja": linha[1],
                "nome_loja": linha[2],
                "estoque_atual": linha[3],
                "quantidade_minima": linha[4],
                "quantidade_recomendada": linha[5],
                "total_consumido_periodo": linha[6],
                "dias_com_consumo": linha[7],
                "ultimo_consumo_em": linha[8],
            }
            for linha in resultados
        ]


def listar_envios_pendentes_atrasados(
    acesso_global: bool = True,
    lojas_ids: list[int] | None = None,
    limite_dias: int = 3,
) -> list[dict]:

    lojas_ids = lojas_ids or []

    sql = """
        SELECT
            e.id,
            e.codigo_remessa,
            e.loja_id,
            l.codigo_loja,
            l.nome_loja,
            e.quantidade_enviada,
            e.data_envio,
            EXTRACT(
                DAY FROM CURRENT_TIMESTAMP - e.data_envio
            )::int AS dias_pendente

        FROM envios_taloes e

        INNER JOIN lojas l
            ON l.id = e.loja_id

        WHERE e.status = 'PENDENTE'
          AND e.data_envio < CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
          AND (
              %s = true
              OR e.loja_id = ANY(%s::int[])
          )

        ORDER BY dias_pendente DESC, e.data_envio ASC;
    """
    with criar_conexao() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(
                sql,
                (limite_dias, acesso_global, lojas_ids),
            )
            resultados = cursor.fetchall()
            return [
                {
                    "envio_id": linha[0],
                    "codigo_remessa": linha[1],
                    "loja_id": linha[2],
                    "codigo_loja": linha[3],
                    "nome_loja": linha[4],
                    "quantidade_enviada": linha[5],
                    "data_envio": linha[6],
                    "dias_pendente": linha[7],
                }
                for linha in resultados
            ]
