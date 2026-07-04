const { query } = require("../database/conexao");

async function listarEnvios() {
  const resultado = await query(`
    SELECT
      e.id AS id,
      e.codigo_remessa AS "codigoRemessa",
      e.loja_id AS "lojaId",
      l.codigo_loja AS "codigoLoja",
      l.nome_loja AS "nomeLoja",
      e.usuario_envio_id AS "usuarioEnvioId",
      e.quantidade_enviada AS "quantidadeEnviada",
      e.data_envio AS "dataEnvio",
      e.status AS status,
      e.criado_em AS "criadoEm"
    FROM envios_taloes e
    JOIN lojas l
      ON l.id = e.loja_id
    ORDER BY e.data_envio DESC
  `);

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
