const { query } = require("../database/conexao");

async function listarRecebimentos() {
  const resultado = await query(`
    SELECT
      r.id AS id,
      r.envio_id AS "envioId",
      r.loja_id AS "lojaId",
      l.codigo_loja AS "codigoLoja",
      l.nome_loja AS "nomeLoja",
      e.codigo_remessa AS "codigoRemessa",
      e.quantidade_enviada AS "quantidadeEnviada",
      r.quantidade_recebida AS "quantidadeRecebida",
      r.usuario_recebimento_id AS "usuarioRecebimentoId",
      r.data_recebimento AS "dataRecebimento",
      r.observacao AS observacao,
      r.criado_em AS "criadoEm"
    FROM recebimentos_taloes r
    JOIN envios_taloes e
      ON e.id = r.envio_id
    JOIN lojas l
      ON l.id = r.loja_id
    ORDER BY r.data_recebimento DESC
  `);

  return resultado.rows;
}

async function buscarEnvioParaRecebimento(client, envioId) {
  const resultado = await client.query(
    `
      SELECT
        id,
        loja_id,
        quantidade_enviada,
        status
      FROM envios_taloes
      WHERE id = $1
      FOR UPDATE
    `,
    [envioId],
  );

  return resultado.rows[0] || null;
}

async function buscarEstoqueLojaParaAtualizar(client, lojaId) {
  const resultado = await client.query(
    `
      SELECT
        estoque_atual
      FROM estoques_lojas
      WHERE loja_id = $1
      FOR UPDATE
    `,
    [lojaId],
  );

  return resultado.rows[0] || null;
}

async function criarRecebimento(client, dados) {
  const resultado = await client.query(
    `
      INSERT INTO recebimentos_taloes (
        envio_id,
        loja_id,
        usuario_recebimento_id,
        quantidade_recebida,
        data_recebimento,
        observacao,
        criado_em
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        NOW(),
        $5,
        NOW()
      )
      RETURNING
        id,
        envio_id,
        loja_id,
        usuario_recebimento_id,
        quantidade_recebida,
        data_recebimento,
        observacao,
        criado_em
    `,
    [
      dados.envioId,
      dados.lojaId,
      dados.usuarioRecebimentoId,
      dados.quantidadeRecebida,
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

async function criarMovimentacaoRecebimento(client, dados) {
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
        $3,
        NULL,
        'RECEBIMENTO',
        $4,
        $5,
        $6,
        $7,
        NOW()
      )
    `,
    [
      dados.lojaId,
      dados.usuarioRecebimentoId,
      dados.recebimentoId,
      dados.quantidadeRecebida,
      dados.saldoAnterior,
      dados.saldoPosterior,
      dados.observacao,
    ],
  );
}

async function marcarEnvioComoRecebido(client, envioId) {
  await client.query(
    `
      UPDATE envios_taloes
      SET status = 'RECEBIDO'
      WHERE id = $1
    `,
    [envioId],
  );
}

module.exports = {
  listarRecebimentos,
  buscarEnvioParaRecebimento,
  buscarEstoqueLojaParaAtualizar,
  criarRecebimento,
  atualizarEstoqueLoja,
  criarMovimentacaoRecebimento,
  marcarEnvioComoRecebido,
};
