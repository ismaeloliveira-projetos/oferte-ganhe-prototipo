const { query } = require("../database/conexao");

async function listarEstoques(contextoUsuario) {
  const parametros = [];
  const filtros = ["l.ativo = true"];

  if (contextoUsuario && !contextoUsuario.acessoGlobal) {
    parametros.push(contextoUsuario.lojasIds);
    filtros.push(`l.id = ANY($${parametros.length}::int[])`);
  }

  const resultado = await query(
    `
      SELECT
        l.id AS "lojaId",
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja",
        e.estoque_atual AS "estoqueAtual",
        l.quantidade_minima AS "estoqueMinimo",
        l.quantidade_recomendada AS "estoqueRecomendado",
        e.atualizado_em AS "atualizadoEm"
      FROM estoques_lojas e
      INNER JOIN lojas l ON l.id = e.loja_id
      WHERE ${filtros.join(" AND ")}
      ORDER BY l.codigo_loja ASC
    `,
    parametros,
  );

  return resultado.rows;
}

async function listarMovimentacoesEstoque(lojaId, contextoUsuario) {
  const parametros = [];
  const filtros = [];

  if (lojaId) {
    parametros.push(lojaId);
    filtros.push(`m.loja_id = $${parametros.length}`);
  }

  if (contextoUsuario && !contextoUsuario.acessoGlobal) {
    parametros.push(contextoUsuario.lojasIds);
    filtros.push(`m.loja_id = ANY($${parametros.length}::int[])`);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

  const resultado = await query(
    `
      SELECT
        m.id,
        m.loja_id AS "lojaId",
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja",
        m.tipo_movimentacao AS "tipoMovimentacao",
        m.quantidade,
        m.saldo_anterior AS "saldoAnterior",
        m.saldo_posterior AS "saldoPosterior",
        m.observacao,
        m.criado_em AS "criadoEm"
      FROM movimentacoes_estoque m
      INNER JOIN lojas l ON l.id = m.loja_id
      ${where}
      ORDER BY m.criado_em DESC
    `,
    parametros,
  );

  return resultado.rows;
}

module.exports = {
  listarEstoques,
  listarMovimentacoesEstoque,
};
