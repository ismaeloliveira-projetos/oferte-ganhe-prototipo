const { query } = require("../database/conexao");

function aplicarFiltroDeLojas(contextoUsuario, parametros, colunaLoja) {
  if (contextoUsuario && !contextoUsuario.acessoGlobal) {
    parametros.push(contextoUsuario.lojasIds);
    return `${colunaLoja} = ANY($${parametros.length}::int[])`;
  }

  return null;
}

async function buscarCardsDashboard(contextoUsuario) {
  const parametros = [];
  const filtros = ["l.ativo = true"];

  const filtroLoja = aplicarFiltroDeLojas(contextoUsuario, parametros, "l.id");

  if (filtroLoja) {
    filtros.push(filtroLoja);
  }

  const resultado = await query(
    `
      SELECT
        COUNT(*) AS "totalLojas",
        COUNT(*) FILTER (
          WHERE e.estoque_atual <= l.quantidade_minima
        ) AS "lojasCriticas",
        COUNT(*) FILTER (
          WHERE e.estoque_atual > l.quantidade_minima
          AND e.estoque_atual < l.quantidade_recomendada
        ) AS "lojasAtencao",
        COUNT(*) FILTER (
          WHERE e.estoque_atual >= l.quantidade_recomendada
        ) AS "lojasNormais"
      FROM lojas l
      INNER JOIN estoques_lojas e ON e.loja_id = l.id
      WHERE ${filtros.join(" AND ")}
    `,
    parametros,
  );

  return resultado.rows[0];
}

async function buscarStatusLojas(contextoUsuario) {
  const parametros = [];
  const filtros = ["l.ativo = true"];

  const filtroLoja = aplicarFiltroDeLojas(contextoUsuario, parametros, "l.id");

  if (filtroLoja) {
    filtros.push(filtroLoja);
  }

  const resultado = await query(
    `
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
      INNER JOIN estoques_lojas e ON e.loja_id = l.id
      WHERE ${filtros.join(" AND ")}
    `,
    parametros,
  );

  return resultado.rows[0];
}

async function buscarLojasComAtencao(contextoUsuario) {
  const parametros = [];
  const filtros = [
    "l.ativo = true",
    "e.estoque_atual < l.quantidade_recomendada",
  ];

  const filtroLoja = aplicarFiltroDeLojas(contextoUsuario, parametros, "l.id");

  if (filtroLoja) {
    filtros.push(filtroLoja);
  }

  const resultado = await query(
    `
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
      INNER JOIN estoques_lojas e ON e.loja_id = l.id
      WHERE ${filtros.join(" AND ")}
      ORDER BY
        CASE
          WHEN e.estoque_atual <= l.quantidade_minima THEN 1
          ELSE 2
        END,
        e.estoque_atual ASC
    `,
    parametros,
  );

  return resultado.rows;
}

async function contarEnviosPendentes(contextoUsuario) {
  const parametros = [];
  const filtros = ["e.status = 'PENDENTE'"];

  const filtroLoja = aplicarFiltroDeLojas(
    contextoUsuario,
    parametros,
    "e.loja_id",
  );

  if (filtroLoja) {
    filtros.push(filtroLoja);
  }

  const resultado = await query(
    `
      SELECT COUNT(*) AS total
      FROM envios_taloes e
      WHERE ${filtros.join(" AND ")}
    `,
    parametros,
  );

  return resultado.rows[0];
}

async function contarRecebimentos(contextoUsuario) {
  const parametros = [];
  const filtros = [];

  const filtroLoja = aplicarFiltroDeLojas(
    contextoUsuario,
    parametros,
    "r.loja_id",
  );

  if (filtroLoja) {
    filtros.push(filtroLoja);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

  const resultado = await query(
    `
      SELECT COUNT(*) AS total
      FROM recebimentos_taloes r
      ${where}
    `,
    parametros,
  );

  return resultado.rows[0];
}

async function contarManutencoes(contextoUsuario) {
  const parametros = [];
  const filtros = [];

  const filtroLoja = aplicarFiltroDeLojas(
    contextoUsuario,
    parametros,
    "m.loja_id",
  );

  if (filtroLoja) {
    filtros.push(filtroLoja);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

  const resultado = await query(
    `
      SELECT COUNT(*) AS total
      FROM manutencoes_taloes m
      ${where}
    `,
    parametros,
  );

  return resultado.rows[0];
}

async function buscarHistoricoEnvios(contextoUsuario) {
  const parametros = [];
  const filtros = ["e.data_envio >= CURRENT_DATE - INTERVAL '6 months'"];

  const filtroLoja = aplicarFiltroDeLojas(
    contextoUsuario,
    parametros,
    "e.loja_id",
  );

  if (filtroLoja) {
    filtros.push(filtroLoja);
  }

  const resultado = await query(
    `
      SELECT
        TO_CHAR(e.data_envio, 'MM/YYYY') AS mes,
        COALESCE(SUM(e.quantidade_enviada), 0) AS total_enviado
      FROM envios_taloes e
      WHERE ${filtros.join(" AND ")}
      GROUP BY TO_CHAR(e.data_envio, 'MM/YYYY'), DATE_TRUNC('month', e.data_envio)
      ORDER BY DATE_TRUNC('month', e.data_envio)
    `,
    parametros,
  );

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
