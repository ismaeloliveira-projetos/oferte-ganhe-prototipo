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
        e.loja_id AS "lojaId",
        l.codigo_loja AS "codigoLoja",
        l.nome_loja AS "nomeLoja",
        e.usuario_envio_id AS "usuarioEnvioId",
        u.nome AS "usuarioEnvioNome",
        e.quantidade_enviada AS "quantidadeEnviada",
        e.status,
        e.criado_em AS "criadoEm"
      FROM envios_taloes e
      INNER JOIN lojas l ON l.id = e.loja_id
      LEFT JOIN usuarios u ON u.id = e.usuario_envio_id
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
      SELECT id
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

async function criarEnvio(dados) {
  const resultado = await query(
    `
      INSERT INTO envios_taloes (
        codigo_remessa,
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
        NOW(),
        'PENDENTE',
        NOW()
      )
      RETURNING
        id,
        codigo_remessa,
        loja_id,
        usuario_envio_id,
        quantidade_enviada,
        data_envio,
        status,
        criado_em
    `,
    [
      dados.codigoRemessa,
      dados.lojaId,
      dados.usuarioEnvioId,
      dados.quantidadeEnviada,
    ],
  );

  return resultado.rows[0];
}

module.exports = {
  listarEnvios,
  buscarLojaAtivaPorId,
  buscarEnvioPorCodigoRemessa,
  criarEnvio,
};
