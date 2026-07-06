const { query } = require("../database/conexao");

async function listarPerfisAtivos() {
  const resultado = await query(`
    SELECT
      id,
      nome_perfil AS "nomePerfil",
      descricao,
      ativo,
      criado_em AS "criadoEm"
    FROM perfis
    WHERE ativo = true
    ORDER BY id ASC
  `);

  return resultado.rows;
}

async function buscarPerfilPorId(id) {
  const resultado = await query(
    `
      SELECT
        id,
        nome_perfil,
        descricao,
        ativo,
        criado_em
      FROM perfis
      WHERE id = $1
    `,
    [id],
  );

  return resultado.rows[0] || null;
}

async function buscarPerfilPorNome(nomePerfil) {
  const resultado = await query(
    `
      SELECT id
      FROM perfis
      WHERE LOWER(nome_perfil) = LOWER($1)
    `,
    [nomePerfil],
  );

  return resultado.rows[0] || null;
}

async function buscarOutroPerfilPorNome(nomePerfil, idIgnorado) {
  const resultado = await query(
    `
      SELECT id
      FROM perfis
      WHERE LOWER(nome_perfil) = LOWER($1)
        AND id <> $2
    `,
    [nomePerfil, idIgnorado],
  );

  return resultado.rows[0] || null;
}

async function criarPerfil(dados) {
  const resultado = await query(
    `
      INSERT INTO perfis (
        id,
        nome_perfil,
        descricao,
        ativo,
        criado_em
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM perfis),
        $1,
        $2,
        true,
        NOW()
      )
      RETURNING
        id,
        nome_perfil,
        descricao,
        ativo,
        criado_em
    `,
    [dados.nomePerfil, dados.descricao],
  );

  return resultado.rows[0];
}

async function atualizarPerfilPorId(id, dados) {
  const resultado = await query(
    `
      UPDATE perfis
      SET
        nome_perfil = $1,
        descricao = $2
      WHERE id = $3
      RETURNING
        id,
        nome_perfil,
        descricao,
        ativo,
        criado_em
    `,
    [dados.nomePerfil, dados.descricao, id],
  );

  return resultado.rows[0] || null;
}

async function inativarPerfilPorId(id) {
  const resultado = await query(
    `
      UPDATE perfis
      SET ativo = false
      WHERE id = $1
      RETURNING
        id,
        nome_perfil,
        descricao,
        ativo,
        criado_em
    `,
    [id],
  );

  return resultado.rows[0] || null;
}

async function buscarUsuarioAtivoPorId(usuarioId) {
  const resultado = await query(
    `
      SELECT id
      FROM usuarios
      WHERE id = $1
        AND ativo = true
    `,
    [usuarioId],
  );

  return resultado.rows[0] || null;
}

async function buscarPerfilAtivoPorId(perfilId) {
  const resultado = await query(
    `
      SELECT id
      FROM perfis
      WHERE id = $1
        AND ativo = true
    `,
    [perfilId],
  );

  return resultado.rows[0] || null;
}

async function buscarVinculoUsuarioPerfil(usuarioId, perfilId) {
  const resultado = await query(
    `
      SELECT id
      FROM usuarios_perfis
      WHERE usuario_id = $1
        AND perfil_id = $2
    `,
    [usuarioId, perfilId],
  );

  return resultado.rows[0] || null;
}

async function vincularPerfilAoUsuario(usuarioId, perfilId) {
  const resultado = await query(
    `
      INSERT INTO usuarios_perfis (
        id,
        usuario_id,
        perfil_id,
        criado_em
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM usuarios_perfis),
        $1,
        $2,
        NOW()
      )
      RETURNING
        id,
        usuario_id,
        perfil_id,
        criado_em
    `,
    [usuarioId, perfilId],
  );

  return resultado.rows[0];
}

async function listarPerfisDoUsuario(usuarioId) {
  const resultado = await query(
    `
      SELECT
        up.id AS "vinculoId",
        p.id AS "perfilId",
        p.nome_perfil AS "nomePerfil",
        p.descricao,
        up.criado_em AS "criadoEm"
      FROM usuarios_perfis up
      JOIN perfis p
        ON p.id = up.perfil_id
      WHERE up.usuario_id = $1
        AND p.ativo = true
      ORDER BY p.nome_perfil ASC
    `,
    [usuarioId],
  );

  return resultado.rows;
}

async function removerPerfilDoUsuario(usuarioId, perfilId) {
  const resultado = await query(
    `
      DELETE FROM usuarios_perfis
      WHERE usuario_id = $1
        AND perfil_id = $2
      RETURNING
        id,
        usuario_id,
        perfil_id,
        criado_em
    `,
    [usuarioId, perfilId],
  );

  return resultado.rows[0] || null;
}

module.exports = {
  listarPerfisAtivos,
  buscarPerfilPorId,
  buscarPerfilPorNome,
  buscarOutroPerfilPorNome,
  criarPerfil,
  atualizarPerfilPorId,
  inativarPerfilPorId,
  buscarUsuarioAtivoPorId,
  buscarPerfilAtivoPorId,
  buscarVinculoUsuarioPerfil,
  vincularPerfilAoUsuario,
  listarPerfisDoUsuario,
  removerPerfilDoUsuario,
};
