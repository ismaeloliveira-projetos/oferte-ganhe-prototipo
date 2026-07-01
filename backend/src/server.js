const http = require("http");
const { query, pool } = require("./config/database");

const PORT = process.env.PORT || 3000;

// essa funcao libera o back end para receber requisicoes de qualquer origem (front end) porque o front end e o back end estao em portas diferentes, entao o navegador bloqueia por padrao //
function aplicarCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// essa funcao envia uma resposta em formato JSON para o front end //
function enviarJson(res, statusCode, dados) {
  aplicarCors(res);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });

  res.end(JSON.stringify(dados));
}

function lerCorpoJson(req) {
  return new Promise((resolve, reject) => {
    let corpo = "";

    req.on("data", (pedaco) => {
      corpo += pedaco;
    });

    req.on("end", () => {
      try {
        const dados = corpo ? JSON.parse(corpo) : {};
        resolve(dados);
      } catch (erro) {
        reject(new Error("JSON inválido no corpo da requisição."));
      }
    });

    req.on("error", (erro) => {
      reject(erro);
    });
  });
}

// essa funcao é o caracao do back end, ela recebe as requisicoes e envia as respostas //
async function roteador(req, res) {
  aplicarCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return enviarJson(res, 200, {
      status: "ok",
      mensagem: "Backend do Oferte e Ganhe rodando",
    });
  }

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
    ORDER BY l.id ASC
  `);

    return enviarJson(res, 200, resultado.rows);
  }

  // rota para cadastrar uma nova loja //
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
      return enviarJson(res, 400, {
        erro: "Código e nome da loja são obrigatórios.",
      });
    }

    if (
      Number.isNaN(estoqueAtual) ||
      Number.isNaN(estoqueMinimo) ||
      Number.isNaN(estoqueRecomendado)
    ) {
      return enviarJson(res, 400, {
        erro: "Estoque atual, mínimo e recomendado devem ser números.",
      });
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
      return enviarJson(res, 409, {
        erro: "Já existe uma loja cadastrada com esse código.",
      });
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

      return enviarJson(res, 201, {
        id: lojaCriada.id,
        codigo: lojaCriada.codigo_loja,
        nome: lojaCriada.nome_loja,
        estoqueAtual: estoqueAtual,
        estoqueMinimo: lojaCriada.quantidade_minima,
        estoqueRecomendado: lojaCriada.quantidade_recomendada,
        ativo: lojaCriada.ativo,
        criadoEm: lojaCriada.criado_em,
      });
    } catch (erro) {
      await client.query("ROLLBACK");
      throw erro;
    } finally {
      client.release();
    }
  }

  // rota para atualizar uma loja existente //
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
      return enviarJson(res, 400, {
        erro: "Código e nome da loja são obrigatórios.",
      });
    }

    if (Number.isNaN(estoqueMinimo) || Number.isNaN(estoqueRecomendado)) {
      return enviarJson(res, 400, {
        erro: "Estoque mínimo e estoque recomendado devem ser números.",
      });
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
      return enviarJson(res, 409, {
        erro: "Já existe outra loja cadastrada com esse código.",
      });
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
      return enviarJson(res, 404, {
        erro: "Loja não encontrada.",
      });
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

    return enviarJson(res, 200, {
      id: lojaAtualizada.id,
      codigo: lojaAtualizada.codigo_loja,
      nome: lojaAtualizada.nome_loja,
      estoqueAtual: estoqueAtual,
      estoqueMinimo: lojaAtualizada.quantidade_minima,
      estoqueRecomendado: lojaAtualizada.quantidade_recomendada,
      ativo: lojaAtualizada.ativo,
      criadoEm: lojaAtualizada.criado_em,
    });
  }

  return enviarJson(res, 404, {
    erro: "Rota não encontrada",
  });
}

const server = http.createServer(async (req, res) => {
  try {
    await roteador(req, res);
  } catch (erro) {
    console.error("Erro no servidor:", erro);

    enviarJson(res, 500, {
      erro: "Erro interno no servidor",
      detalhe: erro.message,
    });
  }
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
