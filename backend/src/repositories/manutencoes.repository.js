const { query } = require("../database/conexao");

async function listarManutencoes() {
  const resultado = await query(`
    SELECT
      m.id AS id,
      m.loja_id AS "lojaId",
      l.codigo_loja AS "codigoLoja",
      l.nome_loja AS "nomeLoja",
      m.usuario_id AS "usuarioId",
      m.tipo_manutencao AS "tipoManutencao",
      m.quantidade AS quantidade,
      m.observacao AS observacao,
      m.criado_em AS "criadoEm"
    FROM manutencoes_taloes m
    JOIN lojas l
      ON l.id = m.loja_id
    ORDER BY m.criado_em DESC
  `);

  return resultado.rows;
}

async function buscarLojaAtivaParaAtualizar(client, lojaId) {
  const resultado = await client.query(
    `
      SELECT id
      FROM lojas
      WHERE id = $1
        AND ativo = true
      FOR UPDATE
    `,
    [lojaId],
  );

  return resultado.rows[0] || null;
}

async function buscarEstoqueLojaParaAtualizar(client, lojaId) {
  const resultado = await client.query(
    `
      SELECT estoque_atual
      FROM estoques_lojas
      WHERE loja_id = $1
      FOR UPDATE
    `,
    [lojaId],
  );

  return resultado.rows[0] || null;
}

async function criarManutencao(client, dados) {
  const resultado = await client.query(
    `
      INSERT INTO manutencoes_taloes (
        loja_id,
        usuario_id,
        tipo_manutencao,
        quantidade,
        observacao,
        criado_em
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        NOW()
      )
      RETURNING
        id,
        loja_id,
        usuario_id,
        tipo_manutencao,
        quantidade,
        observacao,
        criado_em
    `,
    [
      dados.lojaId,
      dados.usuarioId,
      dados.tipoManutencao,
      dados.quantidade,
      dados.observacao,
    ],
  );

  return resultado.rows[0];
}

async function atualizarEstoqueLoja(client, lojaId, saldoPosterior) {
  await client.query(
    `
      UPDATE estoques_lojas
      SET
        estoque_atual = $1,
        atualizado_em = NOW()
      WHERE loja_id = $2
    `,
    [saldoPosterior, lojaId],
  );
}

async function criarMovimentacaoManutencao(client, dados) {
  await client.query(
    `
      INSERT INTO movimentacoes_estoque (
        loja_id,
        usuario_id,
        recebimento_id,
        manutencao_id,
        tipo_movimentacao,
        quantidade,
        saldo_anterior,
        saldo_posterior,
        observacao,
        criado_em
      )
      VALUES (
        $1,
        $2,
        NULL,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        NOW()
      )
    `,
    [
      dados.lojaId,
      dados.usuarioId,
      dados.manutencaoId,
      dados.tipoMovimentacao,
      dados.quantidade,
      dados.saldoAnterior,
      dados.saldoPosterior,
      dados.observacao,
    ],
  );
}

module.exports = {
  listarManutencoes,
  buscarLojaAtivaParaAtualizar,
  buscarEstoqueLojaParaAtualizar,
  criarManutencao,
  atualizarEstoqueLoja,
  criarMovimentacaoManutencao,
};
