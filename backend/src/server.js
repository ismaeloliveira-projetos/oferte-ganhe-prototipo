const http = require("http");
const { query, pool } = require("./config/database");

const { aplicarCors, enviarJson } = require("./utils/http");
const { tratarRotasLojas } = require("./routes/lojas.routes");

const PORT = process.env.PORT || 3000;

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

  const rotaLojasAtendida = await tratarRotasLojas(req, res, url);

  if (rotaLojasAtendida) {
    return;
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
