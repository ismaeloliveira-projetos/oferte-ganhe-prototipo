const { query } = require("../database/conexao");

async function encerrarSessoesAtivasDoUsuario(usuarioId) {
  await query(
    `
      UPDATE sessoes_usuarios
      SET
        ativo = false,
        encerrado_em = NOW()
      WHERE usuario_id = $1
        AND ativo = true
    `,
    [usuarioId],
  );
}

async function criarSessaoUsuario(dados) {
  const resultado = await query(
    `
      INSERT INTO sessoes_usuarios (
        id,
        usuario_id,
        token_sessao,
        dispositivo,
        criado_em,
        expiracao_sessao,
        encerrado_em,
        ativo
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM sessoes_usuarios),
        $1,
        $2,
        $3,
        NOW(),
        $4,
        NULL,
        true
      )
      RETURNING
        id,
        usuario_id AS "usuarioId",
        token_sessao AS "tokenSessao",
        dispositivo,
        criado_em AS "criadoEm",
        expiracao_sessao AS "expiracaoSessao",
        encerrado_em AS "encerradoEm",
        ativo
    `,
    [
      dados.usuarioId,
      dados.tokenSessao,
      dados.dispositivo,
      dados.expiracaoSessao,
    ],
  );

  return resultado.rows[0];
}

async function buscarSessaoPorTokenSessao(tokenSessao) {
  const resultado = await query(
    `
      SELECT
        id,
        usuario_id AS "usuarioId",
        token_sessao AS "tokenSessao",
        dispositivo,
        criado_em AS "criadoEm",
        expiracao_sessao AS "expiracaoSessao",
        encerrado_em AS "encerradoEm",
        ativo
      FROM sessoes_usuarios
      WHERE token_sessao = $1
      LIMIT 1
    `,
    [tokenSessao],
  );

  return resultado.rows[0] || null;
}

async function encerrarSessaoPorTokenSessao(tokenSessao) {
  const resultado = await query(
    `
      UPDATE sessoes_usuarios
      SET
        ativo = false,
        encerrado_em = NOW()
      WHERE token_sessao = $1
        AND ativo = true
      RETURNING
        id,
        usuario_id AS "usuarioId",
        token_sessao AS "tokenSessao",
        dispositivo,
        criado_em AS "criadoEm",
        expiracao_sessao AS "expiracaoSessao",
        encerrado_em AS "encerradoEm",
        ativo
    `,
    [tokenSessao],
  );

  return resultado.rows[0] || null;
}

async function encerrarSessoesExpiradas() {
  await query(
    `
      UPDATE sessoes_usuarios
      SET
        ativo = false,
        encerrado_em = NOW()
      WHERE ativo = true
        AND expiracao_sessao <= NOW()
    `,
  );
}

module.exports = {
  encerrarSessoesAtivasDoUsuario,
  criarSessaoUsuario,
  buscarSessaoPorTokenSessao,
  encerrarSessaoPorTokenSessao,
  encerrarSessoesExpiradas,
};
