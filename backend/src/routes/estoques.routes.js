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

  // GET /api/movimentacoes-estoque
  if (req.method === "GET" && url.pathname === "/api/movimentacoes-estoque") {
    const lojaIdParam = url.searchParams.get("lojaId");

    let filtroLoja = "";
    const parametros = [];

    if (lojaIdParam) {
      const lojaId = Number(lojaIdParam);

      if (Number.isNaN(lojaId)) {
        enviarJson(res, 400, {
          erro: "lojaId deve ser um número.",
        });
        return true;
      }

      filtroLoja = "WHERE m.loja_id = $1";
      parametros.push(lojaId);
    }

    const resultado = await query(
      `
      SELECT
        m.id AS id,
        m.loja_id AS "lojaId",
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja",
        m.usuario_id AS "usuarioId",
        m.recebimento_id AS "recebimentoId",
        m.manutencao_id AS "manutencaoId",
        m.tipo_movimentacao AS "tipoMovimentacao",
        m.quantidade AS quantidade,
        m.saldo_anterior AS "saldoAnterior",
        m.saldo_posterior AS "saldoPosterior",
        m.observacao AS observacao,
        m.criado_em AS "criadoEm",
        e.codigo_remessa AS "codigoRemessa"
      FROM movimentacoes_estoque m
      JOIN lojas l
        ON l.id = m.loja_id
      LEFT JOIN recebimentos_taloes r
        ON r.id = m.recebimento_id
      LEFT JOIN envios_taloes e
        ON e.id = r.envio_id
      ${filtroLoja}
      ORDER BY m.criado_em DESC
    `,
      parametros,
    );

    enviarJson(res, 200, resultado.rows);
    return true;
  }

  return false;
}

module.exports = {
  tratarRotasEstoques,
};
