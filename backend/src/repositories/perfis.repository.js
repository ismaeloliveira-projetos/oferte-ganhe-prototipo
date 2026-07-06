const { query } = require("../database/conexao");

async function listarPerfisAtivos() {
  const resultado = await query(`
    SELECT
      p.id,
      p.nome_perfil AS "nomePerfil",
      p.descricao,
      p.nivel,
      p.ativo,
      p.criado_em AS "criadoEm",
      COALESCE(
        ARRAY_AGG(pe.chave_permissao)
          FILTER (WHERE pe.chave_permissao IS NOT NULL),
        '{}'
      ) AS permissoes
    FROM perfis p
    LEFT JOIN perfis_permissoes pp
      ON pp.perfil_id = p.id
    LEFT JOIN permissoes pe
      ON pe.id = pp.permissao_id
      AND pe.ativo = true
    WHERE p.ativo = true
    GROUP BY
      p.id,
      p.nome_perfil,
      p.descricao,
      p.nivel,
      p.ativo,
      p.criado_em
    ORDER BY p.id ASC
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
        nivel,
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

async function criarPerfil(client, dados) {
  const resultado = await client.query(
    `
      INSERT INTO perfis (
        id,
        nome_perfil,
        descricao,
        nivel,
        ativo,
        criado_em
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM perfis),
        $1,
        $2,
        $3,
        true,
        NOW()
      )
      RETURNING
        id,
        nome_perfil,
        descricao,
        nivel,
        ativo,
        criado_em
    `,
    [dados.nomePerfil, dados.descricao, dados.nivel],
  );

  return resultado.rows[0];
}

async function atualizarPerfilPorId(client, id, dados) {
  const resultado = await client.query(
    `
      UPDATE perfis
      SET
        nome_perfil = $1,
        descricao = $2,
        nivel = $3
      WHERE id = $4
      RETURNING
        id,
        nome_perfil,
        descricao,
        nivel,
        ativo,
        criado_em
    `,
    [dados.nomePerfil, dados.descricao, dados.nivel, id],
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
        nivel,
        ativo,
        criado_em
    `,
    [id],
  );

  return resultado.rows[0] || null;
}

async function buscarPermissoesAtivasPorChaves(chaves) {
  const resultado = await query(
    `
      SELECT
        id,
        nome_permissao,
        chave_permissao
      FROM permissoes
      WHERE ativo = true
        AND chave_permissao = ANY($1)
    `,
    [chaves],
  );

  return resultado.rows;
}

async function removerPermissoesDoPerfil(client, perfilId) {
  await client.query(
    `
      DELETE FROM perfis_permissoes
      WHERE perfil_id = $1
    `,
    [perfilId],
  );
}

async function vincularPermissoesAoPerfil(client, perfilId, permissoesIds) {
  for (const permissaoId of permissoesIds) {
    await client.query(
      `
        INSERT INTO perfis_permissoes (
          id,
          perfil_id,
          permissao_id,
          criado_em
        )
        VALUES (
          (SELECT COALESCE(MAX(id), 0) + 1 FROM perfis_permissoes),
          $1,
          $2,
          NOW()
        )
      `,
      [perfilId, permissaoId],
    );
  }
}

async function listarPermissoesDoPerfil(perfilId) {
  const resultado = await query(
    `
      SELECT
        pe.chave_permissao
      FROM perfis_permissoes pp
      JOIN permissoes pe
        ON pe.id = pp.permissao_id
      WHERE pp.perfil_id = $1
        AND pe.ativo = true
      ORDER BY pe.chave_permissao ASC
    `,
    [perfilId],
  );

  return resultado.rows;
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
        p.nivel,
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
  buscarPermissoesAtivasPorChaves,
  removerPermissoesDoPerfil,
  vincularPermissoesAoPerfil,
  listarPermissoesDoPerfil,
  buscarUsuarioAtivoPorId,
  buscarPerfilAtivoPorId,
  buscarVinculoUsuarioPerfil,
  vincularPerfilAoUsuario,
  listarPerfisDoUsuario,
  removerPerfilDoUsuario,
};
