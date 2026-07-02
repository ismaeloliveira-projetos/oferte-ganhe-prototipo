const { query } = require("../config/database");
const { enviarJson, lerCorpoJson } = require("../utils/http");

async function tratarRotasEnvios(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/envios") {
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

    enviarJson(res, 200, resultado.rows);
    return true;
  }

  // POST /api/envios
  if (req.method === "POST" && url.pathname === "/api/envios") {
    const dados = await lerCorpoJson(req);

    const codigoRemessa = String(dados.codigoRemessa || "").trim();
    const lojaId = Number(dados.lojaId);
    const usuarioEnvioId = dados.usuarioEnvioId
      ? Number(dados.usuarioEnvioId)
      : null;
    const quantidadeEnviada = Number(dados.quantidadeEnviada);

    if (!codigoRemessa || !lojaId || !quantidadeEnviada) {
      enviarJson(res, 400, {
        erro: "Código da remessa, loja e quantidade enviada são obrigatórios.",
      });
      return true;
    }

    if (Number.isNaN(lojaId) || Number.isNaN(quantidadeEnviada)) {
      enviarJson(res, 400, {
        erro: "Loja e quantidade enviada devem ser números.",
      });
      return true;
    }

    if (quantidadeEnviada <= 0) {
      enviarJson(res, 400, {
        erro: "A quantidade enviada deve ser maior que zero.",
      });
      return true;
    }

    const lojaExiste = await query(
      `
        SELECT id
        FROM lojas
        WHERE id = $1
          AND ativo = true
      `,
      [lojaId],
    );

    if (lojaExiste.rows.length === 0) {
      enviarJson(res, 404, {
        erro: "Loja não encontrada ou inativa.",
      });
      return true;
    }

    const remessaExiste = await query(
      `
        SELECT id
        FROM envios_taloes
        WHERE codigo_remessa = $1
      `,
      [codigoRemessa],
    );

    if (remessaExiste.rows.length > 0) {
      enviarJson(res, 409, {
        erro: "Já existe um envio cadastrado com esse código de remessa.",
      });
      return true;
    }

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
      [codigoRemessa, lojaId, usuarioEnvioId, quantidadeEnviada],
    );

    const envioCriado = resultado.rows[0];

    enviarJson(res, 201, {
      id: envioCriado.id,
      codigoRemessa: envioCriado.codigo_remessa,
      lojaId: envioCriado.loja_id,
      usuarioEnvioId: envioCriado.usuario_envio_id,
      quantidadeEnviada: envioCriado.quantidade_enviada,
      dataEnvio: envioCriado.data_envio,
      status: envioCriado.status,
      criadoEm: envioCriado.criado_em,
    });

    return true;
  }

  // POST /api/envios
  if (req.method === "POST" && url.pathname === "/api/envios") {
    const dados = await lerCorpoJson(req);

    const codigoRemessa = String(dados.codigoRemessa || "").trim();
    const lojaId = Number(dados.lojaId);
    const usuarioEnvioId = dados.usuarioEnvioId
      ? Number(dados.usuarioEnvioId)
      : null;
    const quantidadeEnviada = Number(dados.quantidadeEnviada);

    if (!codigoRemessa || !lojaId || !quantidadeEnviada) {
      enviarJson(res, 400, {
        erro: "Código da remessa, loja e quantidade enviada são obrigatórios.",
      });
      return true;
    }

    if (Number.isNaN(lojaId) || Number.isNaN(quantidadeEnviada)) {
      enviarJson(res, 400, {
        erro: "Loja e quantidade enviada devem ser números.",
      });
      return true;
    }

    if (quantidadeEnviada <= 0) {
      enviarJson(res, 400, {
        erro: "A quantidade enviada deve ser maior que zero.",
      });
      return true;
    }

    const lojaExiste = await query(
      `
      SELECT id
      FROM lojas
      WHERE id = $1
        AND ativo = true
    `,
      [lojaId],
    );

    if (lojaExiste.rows.length === 0) {
      enviarJson(res, 404, {
        erro: "Loja não encontrada ou inativa.",
      });
      return true;
    }

    const remessaExiste = await query(
      `
      SELECT id
      FROM envios_taloes
      WHERE codigo_remessa = $1
    `,
      [codigoRemessa],
    );

    if (remessaExiste.rows.length > 0) {
      enviarJson(res, 409, {
        erro: "Já existe um envio cadastrado com esse código de remessa.",
      });
      return true;
    }

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
      [codigoRemessa, lojaId, usuarioEnvioId, quantidadeEnviada],
    );

    const envioCriado = resultado.rows[0];

    enviarJson(res, 201, {
      id: envioCriado.id,
      codigoRemessa: envioCriado.codigo_remessa,
      lojaId: envioCriado.loja_id,
      usuarioEnvioId: envioCriado.usuario_envio_id,
      quantidadeEnviada: envioCriado.quantidade_enviada,
      dataEnvio: envioCriado.data_envio,
      status: envioCriado.status,
      criadoEm: envioCriado.criado_em,
    });

    return true;
  }

  return false;
}

module.exports = {
  tratarRotasEnvios,
};
