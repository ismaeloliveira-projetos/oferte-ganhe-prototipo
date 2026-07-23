const { query } = require("../database/conexao");

async function registrarExportacaoRelatorio(dados) {
  const resultado = await query(
    `
      INSERT INTO relatorios_exportados (
        id,
        usuario_exportacao_id,
        tipo_exportacao,
        arquivo_gerado,
        filtros,
        data_hora_exportacao,
        criado_em
      )
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM relatorios_exportados),
        $1,
        $2,
        $3,
        $4::jsonb,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        usuario_exportacao_id AS "usuarioExportacaoId",
        tipo_exportacao AS "tipoExportacao",
        arquivo_gerado AS "arquivoGerado",
        filtros,
        data_hora_exportacao AS "dataHoraExportacao",
        criado_em AS "criadoEm"
    `,
    [
      dados.usuarioId,
      dados.tipoExportacao,
      dados.arquivoGerado,
      JSON.stringify(dados.filtros || {}),
    ],
  );

  return resultado.rows[0];
}

async function listarExportacoesRelatorios(limite = 50) {
  const resultado = await query(
    `
      SELECT
        re.id,
        re.usuario_exportacao_id AS "usuarioExportacaoId",
        u.nome AS "usuarioNome",
        re.tipo_exportacao AS "tipoExportacao",
        re.arquivo_gerado AS "arquivoGerado",
        re.filtros,
        re.data_hora_exportacao AS "dataHoraExportacao",
        re.criado_em AS "criadoEm"
      FROM relatorios_exportados re
      LEFT JOIN usuarios u
        ON u.id = re.usuario_exportacao_id
      ORDER BY re.data_hora_exportacao DESC
      LIMIT $1
    `,
    [limite],
  );

  return resultado.rows;
}

module.exports = {
  registrarExportacaoRelatorio,
  listarExportacoesRelatorios,
};
