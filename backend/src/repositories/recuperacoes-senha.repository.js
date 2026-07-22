const { query } = require("../database/conexao");

async function invalidarRecuperacoesPendentesDoUsuario(usuarioId) {
  await query(
    `
      UPDATE recuperacoes_senha
      SET usado = true
      WHERE usuario_id = $1
        AND usado = false
    `,
    [usuarioId],
  );
}

async function criarRecuperacaoSenha(dados) {
  const resultado = await query(
    `
      INSERT INTO recuperacoes_senha (
        id,
        usuario_id,
        token,
        usado,
        data_criacao,
        data_expiracao,
        criado_em
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM recuperacoes_senha),
        $1,
        $2,
        false,
        NOW(),
        $3,
        NOW()
      )
      RETURNING
        id,
        usuario_id AS "usuarioId",
        token,
        usado,
        data_criacao AS "dataCriacao",
        data_expiracao AS "dataExpiracao",
        criado_em AS "criadoEm"
    `,
    [dados.usuarioId, dados.tokenHash, dados.dataExpiracao],
  );

  return resultado.rows[0];
}

async function buscarRecuperacaoValidaPorTokenHash(tokenHash) {
  const resultado = await query(
    `
      SELECT
        id,
        usuario_id AS "usuarioId",
        token,
        usado,
        data_criacao AS "dataCriacao",
        data_expiracao AS "dataExpiracao",
        criado_em AS "criadoEm"
      FROM recuperacoes_senha
      WHERE token = $1
        AND usado = false
        AND data_expiracao > NOW()
      LIMIT 1
    `,
    [tokenHash],
  );

  return resultado.rows[0] || null;
}

async function marcarRecuperacaoComoUsada(id) {
  const resultado = await query(
    `
      UPDATE recuperacoes_senha
      SET usado = true
      WHERE id = $1
      RETURNING
        id,
        usuario_id AS "usuarioId",
        token,
        usado,
        data_criacao AS "dataCriacao",
        data_expiracao AS "dataExpiracao",
        criado_em AS "criadoEm"
    `,
    [id],
  );

  return resultado.rows[0] || null;
}

module.exports = {
  invalidarRecuperacoesPendentesDoUsuario,
  criarRecuperacaoSenha,
  buscarRecuperacaoValidaPorTokenHash,
  marcarRecuperacaoComoUsada,
};
