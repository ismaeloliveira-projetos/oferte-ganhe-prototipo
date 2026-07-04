const { query } = require("../database/conexao");

async function buscarCardsDashboard() {
  const resultado = await query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM lojas
        WHERE ativo = true
      ) AS total_lojas,

      (
        SELECT COALESCE(SUM(e.estoque_atual), 0)
        FROM lojas l
        LEFT JOIN estoques_lojas e
          ON e.loja_id = l.id
        WHERE l.ativo = true
      ) AS total_estoque,

      (
        SELECT COUNT(*)
        FROM lojas l
        INNER JOIN estoques_lojas e
          ON e.loja_id = l.id
        WHERE l.ativo = true
          AND e.estoque_atual <= l.quantidade_minima
      ) AS lojas_criticas,

      (
        SELECT COUNT(*)
        FROM envios_taloes
        WHERE DATE_TRUNC('month', data_envio) = DATE_TRUNC('month', CURRENT_DATE)
      ) AS envios_mes;
  `);

  return resultado.rows[0];
}

async function buscarStatusLojas() {
  const resultado = await query(`
    SELECT
      COUNT(*) FILTER (
        WHERE e.estoque_atual <= l.quantidade_minima
      ) AS critico,

      COUNT(*) FILTER (
        WHERE e.estoque_atual > l.quantidade_minima
        AND e.estoque_atual < l.quantidade_recomendada
      ) AS atencao,

      COUNT(*) FILTER (
        WHERE e.estoque_atual >= l.quantidade_recomendada
      ) AS normal
    FROM lojas l
    INNER JOIN estoques_lojas e
      ON e.loja_id = l.id
    WHERE l.ativo = true;
  `);

  return resultado.rows[0];
}

async function buscarLojasComAtencao() {
  const resultado = await query(`
    SELECT
      l.codigo_loja AS codigo_loja,
      l.nome_loja AS nome_loja,
      e.estoque_atual,
      l.quantidade_minima,
      l.quantidade_recomendada,
      CASE
        WHEN e.estoque_atual <= l.quantidade_minima THEN 'Crítico'
        WHEN e.estoque_atual < l.quantidade_recomendada THEN 'Atenção'
        ELSE 'Normal'
      END AS status_estoque
    FROM lojas l
    INNER JOIN estoques_lojas e
      ON e.loja_id = l.id
    WHERE l.ativo = true
      AND e.estoque_atual < l.quantidade_recomendada
    ORDER BY
      CASE
        WHEN e.estoque_atual <= l.quantidade_minima THEN 1
        ELSE 2
      END,
      e.estoque_atual ASC;
  `);

  return resultado.rows;
}

async function contarEnviosPendentes() {
  const resultado = await query(`
    SELECT COUNT(*) AS total
    FROM envios_taloes
    WHERE status = 'PENDENTE';
  `);

  return resultado.rows[0];
}

async function contarRecebimentos() {
  const resultado = await query(`
    SELECT COUNT(*) AS total
    FROM recebimentos_taloes;
  `);

  return resultado.rows[0];
}

async function contarManutencoes() {
  const resultado = await query(`
    SELECT COUNT(*) AS total
    FROM manutencoes_taloes;
  `);

  return resultado.rows[0];
}

async function buscarHistoricoEnvios() {
  const resultado = await query(`
    SELECT
      TO_CHAR(data_envio, 'MM/YYYY') AS mes,
      COALESCE(SUM(quantidade_enviada), 0) AS total_enviado
    FROM envios_taloes
    WHERE data_envio >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(data_envio, 'MM/YYYY'), DATE_TRUNC('month', data_envio)
    ORDER BY DATE_TRUNC('month', data_envio);
  `);

  return resultado.rows;
}

module.exports = {
  buscarCardsDashboard,
  buscarStatusLojas,
  buscarLojasComAtencao,
  contarEnviosPendentes,
  contarRecebimentos,
  contarManutencoes,
  buscarHistoricoEnvios,
};
