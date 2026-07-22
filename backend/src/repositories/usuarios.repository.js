const { query } = require("../database/conexao");

async function listarUsuariosAtivos() {
  const resultado = await query(`
    SELECT
      id,
      nome,
      matricula,
      email,
      ativo,
      criado_em AS "criadoEm"
    FROM usuarios
    WHERE ativo = true
    ORDER BY id ASC
  `);

  return resultado.rows;
}

async function buscarUsuarioPorId(id) {
  const resultado = await query(
    `
      SELECT
        id,
        nome,
        matricula,
        email,
        ativo,
        criado_em
      FROM usuarios
      WHERE id = $1
    `,
    [id],
  );

  return resultado.rows[0] || null;
}

async function buscarUsuarioPorEmail(email) {
  const resultado = await query(
    `
      SELECT id
      FROM usuarios
      WHERE LOWER(email) = LOWER($1)
    `,
    [email],
  );

  return resultado.rows[0] || null;
}

async function buscarUsuarioPorMatricula(matricula) {
  const resultado = await query(
    `
      SELECT id
      FROM usuarios
      WHERE matricula = $1
    `,
    [matricula],
  );

  return resultado.rows[0] || null;
}

async function buscarOutroUsuarioPorEmail(email, idIgnorado) {
  const resultado = await query(
    `
      SELECT id
      FROM usuarios
      WHERE LOWER(email) = LOWER($1)
        AND id <> $2
    `,
    [email, idIgnorado],
  );

  return resultado.rows[0] || null;
}

async function buscarOutroUsuarioPorMatricula(matricula, idIgnorado) {
  const resultado = await query(
    `
      SELECT id
      FROM usuarios
      WHERE matricula = $1
        AND id <> $2
    `,
    [matricula, idIgnorado],
  );

  return resultado.rows[0] || null;
}

async function criarUsuario(dados) {
  const resultado = await query(
    `
      INSERT INTO usuarios (
        id,
        nome,
        matricula,
        email,
        senha_hash,
        ativo,
        criado_em
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM usuarios),
        $1,
        $2,
        $3,
        $4,
        true,
        NOW()
      )
      RETURNING
        id,
        nome,
        matricula,
        email,
        ativo,
        criado_em
    `,
    [dados.nome, dados.matricula, dados.email, dados.senhaHash],
  );

  return resultado.rows[0];
}

async function atualizarUsuarioPorId(id, dados) {
  const resultado = await query(
    `
      UPDATE usuarios
      SET
        nome = $1,
        matricula = $2,
        email = $3
      WHERE id = $4
      RETURNING
        id,
        nome,
        matricula,
        email,
        ativo,
        criado_em
    `,
    [dados.nome, dados.matricula, dados.email, id],
  );

  return resultado.rows[0] || null;
}

async function inativarUsuarioPorId(id) {
  const resultado = await query(
    `
      UPDATE usuarios
      SET ativo = false
      WHERE id = $1
      RETURNING
        id,
        nome,
        matricula,
        email,
        ativo,
        criado_em
    `,
    [id],
  );

  return resultado.rows[0] || null;
}

async function removerLojasDoUsuario(usuarioId) {
  await query(
    `
      DELETE FROM usuarios_lojas
      WHERE usuario_id = $1
    `,
    [usuarioId],
  );
}

async function vincularLojaAoUsuario(usuarioId, lojaId) {
  const resultado = await query(
    `
      INSERT INTO usuarios_lojas (
        id,
        usuario_id,
        loja_id,
        criado_em
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM usuarios_lojas),
        $1,
        $2,
        NOW()
      )
      RETURNING
        id,
        usuario_id,
        loja_id,
        criado_em
    `,
    [usuarioId, lojaId],
  );

  return resultado.rows[0];
}

async function listarLojasDoUsuario(usuarioId) {
  const resultado = await query(
    `
      SELECT
        l.id,
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja",
        ul.criado_em AS "criadoEm"
      FROM usuarios_lojas ul
      JOIN lojas l
        ON l.id = ul.loja_id
      WHERE ul.usuario_id = $1
        AND l.ativo = true
      ORDER BY l.codigo_loja ASC
    `,
    [usuarioId],
  );

  return resultado.rows;
}

async function buscarLojaAtivaPorId(lojaId) {
  const resultado = await query(
    `
      SELECT id
      FROM lojas
      WHERE id = $1
        AND ativo = true
    `,
    [lojaId],
  );

  return resultado.rows[0] || null;
}

async function atualizarSenhaUsuarioPorId(id, senhaHash) {
  const resultado = await query(
    `
      UPDATE usuarios
      SET senha_hash = $1
      WHERE id = $2
        AND ativo = true
      RETURNING
        id,
        nome,
        matricula,
        email,
        ativo,
        criado_em
    `,
    [senhaHash, id],
  );

  return resultado.rows[0] || null;
}

module.exports = {
  listarUsuariosAtivos,
  buscarUsuarioPorId,
  buscarUsuarioPorEmail,
  buscarUsuarioPorMatricula,
  buscarOutroUsuarioPorEmail,
  buscarOutroUsuarioPorMatricula,
  criarUsuario,
  atualizarSenhaUsuarioPorId,
  atualizarUsuarioPorId,
  inativarUsuarioPorId,
  removerLojasDoUsuario,
  vincularLojaAoUsuario,
  listarLojasDoUsuario,
  buscarLojaAtivaPorId,
};
