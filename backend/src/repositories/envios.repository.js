const { query } = require("../database/conexao");

async function listarEnvios(contextoUsuario) {
  const parametros = [];
  const filtros = [];

  if (contextoUsuario && !contextoUsuario.acessoGlobal) {
    parametros.push(contextoUsuario.lojasIds);
    filtros.push(`e.loja_id = ANY($${parametros.length}::int[])`);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

  const resultado = await query(
    `
      SELECT
        e.id,
        e.codigo_remessa AS "codigoRemessa",

        e.loja_origem_id AS "lojaOrigemId",
        origem.codigo_loja AS "codigoLojaOrigem",
        origem.nome_loja AS "nomeLojaOrigem",

        e.loja_id AS "lojaId",
        destino.codigo_loja AS "codigoLoja",
        destino.nome_loja AS "nomeLoja",

        e.usuario_envio_id AS "usuarioEnvioId",
        u.nome AS "usuarioEnvioNome",

        e.quantidade_enviada AS "quantidadeEnviada",
        e.status,
        e.criado_em AS "criadoEm"
      FROM envios_taloes e
      INNER JOIN lojas destino
        ON destino.id = e.loja_id
     LEFT JOIN lojas origem
  ON origem.id = e.loja_origem_id
      LEFT JOIN usuarios u
        ON u.id = e.usuario_envio_id
      ${where}
      ORDER BY e.criado_em DESC
    `,
    parametros,
  );

  return resultado.rows;
}

async function buscarLojaAtivaPorId(lojaId) {
  const resultado = await query(
    `
      SELECT
  id,
  codigo_loja AS "codigoLoja",
  nome_loja AS "nomeLoja"
      FROM lojas
      WHERE id = $1
        AND ativo = true
    `,
    [lojaId],
  );

  return resultado.rows[0] || null;
}

async function buscarEnvioPorCodigoRemessa(codigoRemessa) {
  const resultado = await query(
    `
      SELECT id
      FROM envios_taloes
      WHERE codigo_remessa = $1
    `,
    [codigoRemessa],
  );

  return resultado.rows[0] || null;
}

async function buscarEstoqueParaAtualizacao(client, lojaId) {
  const resultado = await client.query(
    `
     SELECT
  e.loja_id AS "lojaId",
  e.estoque_atual AS "estoqueAtual",
  l.quantidade_minima AS "quantidadeMinima"
FROM estoques_lojas e
INNER JOIN lojas l
  ON l.id = e.loja_id
WHERE e.loja_id = $1
  AND l.ativo = true
FOR UPDATE
    `,
    [lojaId],
  );

  return resultado.rows[0] || null;
}

async function atualizarEstoqueLoja(client, lojaId, estoqueAtualizado) {
  const resultado = await client.query(
    `
      UPDATE estoques_lojas
      SET
        estoque_atual = $2,
        atualizado_em = NOW()
      WHERE loja_id = $1
      RETURNING
        loja_id AS "lojaId",
        estoque_atual AS "estoqueAtual"
    `,
    [lojaId, estoqueAtualizado],
  );

  return resultado.rows[0] || null;
}

async function criarEnvio(client, dados) {
  const resultado = await client.query(
    `
      INSERT INTO envios_taloes (
        codigo_remessa,
        loja_origem_id,
        loja_id,
        usuario_envio_id,
        quantidade_enviada,
        data_envio,
        status,
        criado_em
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        NOW(),
        'PENDENTE',
        NOW()
      )
      RETURNING
        id,
        codigo_remessa,
        loja_origem_id,
        loja_id,
        usuario_envio_id,
        quantidade_enviada,
        data_envio,
        status,
        criado_em
    `,
    [
      dados.codigoRemessa,
      dados.lojaOrigemId,
      dados.lojaId,
      dados.usuarioEnvioId,
      dados.quantidadeEnviada,
    ],
  );

  return resultado.rows[0];
}

async function criarMovimentacaoEnvio(client, dados) {
  const resultado = await client.query(
    `
      INSERT INTO movimentacoes_estoque (
        loja_id,
        usuario_id,
        envio_id,
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
        'ENVIO_SAIDA',
        $4,
        $5,
        $6,
        $7,
        NOW()
      )
      RETURNING id
    `,
    [
      dados.lojaId,
      dados.usuarioId,
      dados.envioId,
      dados.quantidade,
      dados.saldoAnterior,
      dados.saldoPosterior,
      dados.observacao,
    ],
  );

  return resultado.rows[0];
}

async function listarDestinatariosAtivosPorLojaId(lojaId) {
  const resultado = await query(
    `
      SELECT DISTINCT
        u.id,
        u.nome,
        u.email
      FROM usuarios_lojas ul
      INNER JOIN usuarios u
        ON u.id = ul.usuario_id
      WHERE ul.loja_id = $1
        AND u.ativo = true
        AND NULLIF(TRIM(u.email), '') IS NOT NULL
      ORDER BY u.nome ASC
    `,
    [lojaId],
  );

  return resultado.rows;
}

module.exports = {
  listarEnvios,
  buscarLojaAtivaPorId,
  buscarEnvioPorCodigoRemessa,
  buscarEstoqueParaAtualizacao,
  listarDestinatariosAtivosPorLojaId,
  atualizarEstoqueLoja,
  criarEnvio,
  criarMovimentacaoEnvio,
};
