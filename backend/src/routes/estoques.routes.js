const { query } = require("../config/database");
const { enviarJson } = require("../utils/http");

async function tratarRotasEstoques(req, res, url) {
  // GET /api/estoques
  if (req.method === "GET" && url.pathname === "/api/estoques") {
    const resultado = await query(`
      SELECT
        l.id AS "lojaId",
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja",
        COALESCE(e.estoque_atual, 0) AS "estoqueAtual",
        l.quantidade_minima AS "estoqueMinimo",
        l.quantidade_recomendada AS "estoqueRecomendado",
        e.atualizado_em AS "atualizadoEm",
        CASE
          WHEN COALESCE(e.estoque_atual, 0) <= l.quantidade_minima THEN 'Crítico'
          WHEN COALESCE(e.estoque_atual, 0) < l.quantidade_recomendada THEN 'Atenção'
          ELSE 'Normal'
        END AS "statusEstoque"
      FROM lojas l
      LEFT JOIN estoques_lojas e
        ON e.loja_id = l.id
      WHERE l.ativo = true
      ORDER BY l.codigo_loja ASC
    `);

    enviarJson(res, 200, resultado.rows);
    return true;
  }

  return false;
}

module.exports = {
  tratarRotasEstoques,
};
