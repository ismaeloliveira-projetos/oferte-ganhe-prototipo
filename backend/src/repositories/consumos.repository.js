const { query } = require("../database/conexao");

async function listarConsumos(contextoUsuario) {
  const parametros = [];
  const filtros = [];

  if (contextoUsuario && !contextoUsuario.acessoGlobal) {
    parametros.push(contextoUsuario.lojasIds);
    filtros.push(`c.loja_id = ANY($${parametros.length}::int[])`);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

  const resultado = await query(
    `
      SELECT
        c.id,
        c.loja_id AS "lojaId",
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja",
        c.usuario_id AS "usuarioId",
        u.nome AS "usuarioNome",
        c.quantidade,
        c.observacao AS "observacao",
        c.data_consumo AS "dataConsumo",
        c.criado_em AS "criadoEm"
      FROM consumos_taloes c
      INNER JOIN lojas l ON l.id = c.loja_id
      INNER JOIN usuarios u ON u.id = c.usuario_id
      ${where}
      ORDER BY c.data_consumo DESC, c.criado_em DESC
    `,
    parametros,
  );

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

async function criarConsumo(client, dados) {
  const resultado = await client.query(
    `
      INSERT INTO consumos_taloes (
        loja_id,
        usuario_id,
        quantidade,
        observacao,
        data_consumo,
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
        quantidade,
        observacao,
        data_consumo,
        criado_em
    `,
    [
      dados.lojaId,
      dados.usuarioId,
      dados.quantidade,
      dados.observacao,
      dados.dataConsumo,
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

async function criarMovimentacaoConsumo(client, dados) {
  await client.query(
    `
      INSERT INTO movimentacoes_estoque (
        loja_id,
        usuario_id,
        recebimento_id,
        manutencao_id,
        consumo_id,
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
        NULL,
        $3,
        'CONSUMO_UTILIZACAO',
        $4,
        $5,
        $6,
        $7,
        NOW()
      )
    `,
    [
      dados.lojaId,
      dados.usuarioId,
      dados.consumoId,
      dados.quantidade,
      dados.saldoAnterior,
      dados.saldoPosterior,
      dados.observacao,
    ],
  );
}

module.exports = {
  listarConsumos,
  buscarLojaAtivaParaAtualizar,
  buscarEstoqueLojaParaAtualizar,
  criarConsumo,
  atualizarEstoqueLoja,
  criarMovimentacaoConsumo,
};
