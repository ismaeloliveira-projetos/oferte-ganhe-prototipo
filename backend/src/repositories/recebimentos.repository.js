const { query } = require("../database/conexao");

async function listarRecebimentos(contextoUsuario) {
  const parametros = [];
  const filtros = [];

  if (contextoUsuario && !contextoUsuario.acessoGlobal) {
    parametros.push(contextoUsuario.lojasIds);
    filtros.push(`r.loja_id = ANY($${parametros.length}::int[])`);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

  const resultado = await query(
    `
      SELECT
        r.id,
        r.envio_id AS "envioId",
        r.loja_id AS "lojaId",
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja",
        e.codigo_remessa AS "codigoRemessa",
        r.usuario_recebimento_id AS "usuarioRecebimentoId",
        u.nome AS "usuarioRecebimentoNome",
        r.quantidade_recebida AS "quantidadeRecebida",
        r.data_recebimento AS "dataRecebimento",
        r.criado_em AS "criadoEm"
      FROM recebimentos_taloes r
      INNER JOIN envios_taloes e ON e.id = r.envio_id
      INNER JOIN lojas l ON l.id = r.loja_id
      LEFT JOIN usuarios u ON u.id = r.usuario_recebimento_id
      ${where}
      ORDER BY r.criado_em DESC
    `,
    parametros,
  );

  return resultado.rows;
}

async function buscarEnvioParaRecebimento(client, envioId) {
  const resultado = await client.query(
    `
      SELECT
        e.id,
        e.loja_id AS "lojaId",
        e.quantidade_enviada AS "quantidadeEnviada",
        e.status
      FROM envios_taloes e
      WHERE e.id = $1
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
