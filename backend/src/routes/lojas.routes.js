const { query, pool } = require("../config/database");
const { enviarJson, lerCorpoJson } = require("../utils/http");

async function tratarRotasLojas(req, res, url) {
  // GET /api/lojas
  if (req.method === "GET" && url.pathname === "/api/lojas") {
    const resultado = await query(`
      SELECT
        l.id AS id,
        l.codigo_loja AS codigo,
        l.nome_loja AS nome,
        COALESCE(e.estoque_atual, 0) AS "estoqueAtual",
        l.quantidade_minima AS "estoqueMinimo",
        l.quantidade_recomendada AS "estoqueRecomendado",
        l.ativo AS ativo,
        l.criado_em AS "criadoEm"
      FROM lojas l
      LEFT JOIN estoques_lojas e
        ON e.loja_id = l.id
      WHERE l.ativo = true
      ORDER BY l.id ASC
    `);

    enviarJson(res, 200, resultado.rows);
    return true;
  }

  // POST /api/lojas
  if (req.method === "POST" && url.pathname === "/api/lojas") {
    const dados = await lerCorpoJson(req);

    const codigo = String(dados.codigo || "")
      .trim()
      .padStart(3, "0");
    const nome = String(dados.nome || "").trim();

    const estoqueAtual = Number(dados.estoqueAtual ?? 0);
    const estoqueMinimo = Number(dados.estoqueMinimo ?? 200);
    const estoqueRecomendado = Number(dados.estoqueRecomendado ?? 300);

    if (!codigo || !nome) {
      enviarJson(res, 400, {
        erro: "Código e nome da loja são obrigatórios.",
      });
      return true;
    }

    if (
      Number.isNaN(estoqueAtual) ||
      Number.isNaN(estoqueMinimo) ||
      Number.isNaN(estoqueRecomendado)
    ) {
      enviarJson(res, 400, {
        erro: "Estoque atual, mínimo e recomendado devem ser números.",
      });
      return true;
    }

    const lojaExistente = await query(
      `
        SELECT id
        FROM lojas
        WHERE codigo_loja = $1
      `,
      [codigo],
    );

    if (lojaExistente.rows.length > 0) {
      enviarJson(res, 409, {
        erro: "Já existe uma loja cadastrada com esse código.",
      });
      return true;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resultadoLoja = await client.query(
        `
          INSERT INTO lojas (
            id,
            codigo_loja,
            nome_loja,
            quantidade_minima,
            quantidade_recomendada,
            ativo,
            criado_em
          )
          VALUES (
            (SELECT COALESCE(MAX(id), 0) + 1 FROM lojas),
            $1,
            $2,
            $3,
            $4,
            true,
            NOW()
          )
          RETURNING
            id,
            codigo_loja,
            nome_loja,
            quantidade_minima,
            quantidade_recomendada,
            ativo,
            criado_em
        `,
        [codigo, nome, estoqueMinimo, estoqueRecomendado],
      );

      const lojaCriada = resultadoLoja.rows[0];

      await client.query(
        `
          INSERT INTO estoques_lojas (
            loja_id,
            estoque_atual,
            atualizado_em
          )
          VALUES (
            $1,
            $2,
            NOW()
          )
        `,
        [lojaCriada.id, estoqueAtual],
      );

      await client.query("COMMIT");

      enviarJson(res, 201, {
        id: lojaCriada.id,
        codigo: lojaCriada.codigo_loja,
        nome: lojaCriada.nome_loja,
        estoqueAtual,
        estoqueMinimo: lojaCriada.quantidade_minima,
        estoqueRecomendado: lojaCriada.quantidade_recomendada,
        ativo: lojaCriada.ativo,
        criadoEm: lojaCriada.criado_em,
      });

      return true;
    } catch (erro) {
      await client.query("ROLLBACK");
      throw erro;
    } finally {
      client.release();
    }
  }

  // PUT /api/lojas/:codigo
  if (req.method === "PUT" && url.pathname.startsWith("/api/lojas/")) {
    const codigoOriginal = decodeURIComponent(url.pathname.split("/").pop());

    const dados = await lerCorpoJson(req);

    const codigo = String(dados.codigo || "")
      .trim()
      .padStart(3, "0");
    const nome = String(dados.nome || "").trim();

    const estoqueMinimo = Number(dados.estoqueMinimo ?? 200);
    const estoqueRecomendado = Number(dados.estoqueRecomendado ?? 300);

    if (!codigo || !nome) {
      enviarJson(res, 400, {
        erro: "Código e nome da loja são obrigatórios.",
      });
      return true;
    }

    if (Number.isNaN(estoqueMinimo) || Number.isNaN(estoqueRecomendado)) {
      enviarJson(res, 400, {
        erro: "Estoque mínimo e estoque recomendado devem ser números.",
      });
      return true;
    }

    const lojaComMesmoCodigo = await query(
      `
        SELECT id
        FROM lojas
        WHERE codigo_loja = $1
          AND codigo_loja <> $2
      `,
      [codigo, codigoOriginal],
    );

    if (lojaComMesmoCodigo.rows.length > 0) {
      enviarJson(res, 409, {
        erro: "Já existe outra loja cadastrada com esse código.",
      });
      return true;
    }

    const resultado = await query(
      `
        UPDATE lojas
        SET
          codigo_loja = $1,
          nome_loja = $2,
          quantidade_minima = $3,
          quantidade_recomendada = $4
        WHERE codigo_loja = $5
        RETURNING
          id,
          codigo_loja,
          nome_loja,
          quantidade_minima,
          quantidade_recomendada,
          ativo,
          criado_em
      `,
      [codigo, nome, estoqueMinimo, estoqueRecomendado, codigoOriginal],
    );

    if (resultado.rows.length === 0) {
      enviarJson(res, 404, {
        erro: "Loja não encontrada.",
      });
      return true;
    }

    const lojaAtualizada = resultado.rows[0];

    const resultadoEstoque = await query(
      `
        SELECT estoque_atual
        FROM estoques_lojas
        WHERE loja_id = $1
      `,
      [lojaAtualizada.id],
    );

    const estoqueAtual = resultadoEstoque.rows[0]?.estoque_atual ?? 0;

    enviarJson(res, 200, {
      id: lojaAtualizada.id,
      codigo: lojaAtualizada.codigo_loja,
      nome: lojaAtualizada.nome_loja,
      estoqueAtual,
      estoqueMinimo: lojaAtualizada.quantidade_minima,
      estoqueRecomendado: lojaAtualizada.quantidade_recomendada,
      ativo: lojaAtualizada.ativo,
      criadoEm: lojaAtualizada.criado_em,
    });

    return true;
  }

  // PATCH /api/lojas/:codigo/inativar
  if (
    req.method === "PATCH" &&
    url.pathname.startsWith("/api/lojas/") &&
    url.pathname.endsWith("/inativar")
  ) {
    const partesUrl = url.pathname.split("/");
    const codigo = decodeURIComponent(partesUrl[3]);

    const resultado = await query(
      `
        UPDATE lojas
        SET ativo = false
        WHERE codigo_loja = $1
        RETURNING
          id,
          codigo_loja,
          nome_loja,
          quantidade_minima,
          quantidade_recomendada,
          ativo,
          criado_em
      `,
      [codigo],
    );

    if (resultado.rows.length === 0) {
      enviarJson(res, 404, {
        erro: "Loja não encontrada.",
      });
      return true;
    }

    const lojaInativada = resultado.rows[0];

    enviarJson(res, 200, {
      id: lojaInativada.id,
      codigo: lojaInativada.codigo_loja,
      nome: lojaInativada.nome_loja,
      estoqueMinimo: lojaInativada.quantidade_minima,
      estoqueRecomendado: lojaInativada.quantidade_recomendada,
      ativo: lojaInativada.ativo,
      criadoEm: lojaInativada.criado_em,
      mensagem: "Loja inativada com sucesso.",
    });

    return true;
  }

  return false;
}

module.exports = {
  tratarRotasLojas,
};
