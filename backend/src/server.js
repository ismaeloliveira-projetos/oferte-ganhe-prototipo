const http = require("http");
const { query } = require("./config/database");

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

function enviarJson(res, statusCode, dados) {
  aplicarCors(res);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });

  res.end(JSON.stringify(dados));
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
      id,
      codigo_loja,
      nome_loja,
      quantidade_minima,
      quantidade_recomendada,
      ativo,
      criado_em
    FROM lojas
    ORDER BY id ASC
  `);

    return enviarJson(res, 200, resultado.rows);
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
