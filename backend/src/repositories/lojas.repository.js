const { query } = require("../database/conexao");

async function listarLojasAtivas() {
  const resultado = await query(`
    SELECT
      l.id AS id,
      l.codigo_loja AS codigo,
      l.nome_loja AS nome,
      COALESCE(e.estoque_atual, 0) AS "estoqueAtual",
      l.quantidade_minima AS "estoqueMinimo",
      l.quantidade_recomendada AS "estoqueRecomendado",
      l.ativo AS ativo,
      l.criado_em AS "criadoEm"
    FROM lojas l
    LEFT JOIN estoques_lojas e
      ON e.loja_id = l.id
    WHERE l.ativo = true
    ORDER BY l.id ASC
  `);

  return resultado.rows;
}

async function buscarLojaPorCodigo(codigo) {
  const resultado = await query(
    `
      SELECT
        id,
        codigo_loja,
        nome_loja,
        quantidade_minima,
        quantidade_recomendada,
        ativo,
        criado_em
      FROM lojas
      WHERE codigo_loja = $1
    `,
    [codigo],
  );

  return resultado.rows[0] || null;
}

async function buscarLojaComCodigoDiferente(codigo, codigoOriginal) {
  const resultado = await query(
    `
      SELECT id
      FROM lojas
      WHERE codigo_loja = $1
        AND codigo_loja <> $2
    `,
    [codigo, codigoOriginal],
  );

  return resultado.rows[0] || null;
}

async function criarLoja(client, dados) {
  const resultado = await client.query(
    `
      INSERT INTO lojas (
        id,
        codigo_loja,
        nome_loja,
        quantidade_minima,
        quantidade_recomendada,
        ativo,
        criado_em
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM lojas),
        $1,
        $2,
        $3,
        $4,
        true,
        NOW()
      )
      RETURNING
        id,
        codigo_loja,
        nome_loja,
        quantidade_minima,
        quantidade_recomendada,
        ativo,
        criado_em
    `,
    [dados.codigo, dados.nome, dados.estoqueMinimo, dados.estoqueRecomendado],
  );

  return resultado.rows[0];
}

async function criarEstoqueInicial(client, lojaId, estoqueAtual) {
  await client.query(
    `
      INSERT INTO estoques_lojas (
        loja_id,
        estoque_atual,
        atualizado_em
      )
      VALUES (
        $1,
        $2,
        NOW()
      )
    `,
    [lojaId, estoqueAtual],
  );
}

async function atualizarLojaPorCodigo(codigoOriginal, dados) {
  const resultado = await query(
    `
      UPDATE lojas
      SET
        codigo_loja = $1,
        nome_loja = $2,
        quantidade_minima = $3,
        quantidade_recomendada = $4
      WHERE codigo_loja = $5
      RETURNING
        id,
        codigo_loja,
        nome_loja,
        quantidade_minima,
        quantidade_recomendada,
        ativo,
        criado_em
    `,
    [
      dados.codigo,
      dados.nome,
      dados.estoqueMinimo,
      dados.estoqueRecomendado,
      codigoOriginal,
    ],
  );

  return resultado.rows[0] || null;
}

async function buscarEstoquePorLojaId(lojaId) {
  const resultado = await query(
    `
      SELECT estoque_atual
      FROM estoques_lojas
      WHERE loja_id = $1
    `,
    [lojaId],
  );

  return resultado.rows[0] || null;
}

async function inativarLojaPorCodigo(codigo) {
  const resultado = await query(
    `
      UPDATE lojas
      SET ativo = false
      WHERE codigo_loja = $1
      RETURNING
        id,
        codigo_loja,
        nome_loja,
        quantidade_minima,
        quantidade_recomendada,
        ativo,
        criado_em
    `,
    [codigo],
  );

  return resultado.rows[0] || null;
}

module.exports = {
  listarLojasAtivas,
  buscarLojaPorCodigo,
  buscarLojaComCodigoDiferente,
  criarLoja,
  criarEstoqueInicial,
  atualizarLojaPorCodigo,
  buscarEstoquePorLojaId,
  inativarLojaPorCodigo,
};
