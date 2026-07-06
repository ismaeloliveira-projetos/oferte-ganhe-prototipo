const { query } = require("../database/conexao");

async function buscarUsuarioPorEmailComSenha(email) {
  const resultado = await query(
    `
      SELECT
        id,
        nome,
        matricula,
        email,
        senha_hash,
        ativo,
        criado_em
      FROM usuarios
      WHERE LOWER(email) = LOWER($1)
    `,
    [email],
  );

  return resultado.rows[0] || null;
}

async function listarPerfisDoUsuario(usuarioId) {
  const resultado = await query(
    `
      SELECT
        p.id,
        p.nome_perfil AS "nomePerfil",
        p.nivel,
        p.descricao
      FROM usuarios_perfis up
      JOIN perfis p
        ON p.id = up.perfil_id
      WHERE up.usuario_id = $1
        AND p.ativo = true
      ORDER BY p.nivel DESC
    `,
    [usuarioId],
  );

  return resultado.rows;
}

async function listarPermissoesDoUsuario(usuarioId) {
  const resultado = await query(
    `
      SELECT DISTINCT
        pe.chave_permissao AS permissao
      FROM usuarios_perfis up
      JOIN perfis p
        ON p.id = up.perfil_id
      JOIN perfis_permissoes pp
        ON pp.perfil_id = p.id
      JOIN permissoes pe
        ON pe.id = pp.permissao_id
      WHERE up.usuario_id = $1
        AND p.ativo = true
        AND pe.ativo = true
      ORDER BY pe.chave_permissao ASC
    `,
    [usuarioId],
  );

  return resultado.rows;
}

async function listarLojasDoUsuario(usuarioId) {
  const resultado = await query(
    `
      SELECT
        l.id,
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja"
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

module.exports = {
  buscarUsuarioPorEmailComSenha,
  listarPerfisDoUsuario,
  listarPermissoesDoUsuario,
  listarLojasDoUsuario,
};
