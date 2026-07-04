const express = require("express");
const cors = require("cors");

const { enviarJson } = require("./utils/http");

const lojasRoutes = require("./routes/lojas.routes");
const estoquesRoutes = require("./routes/estoques.routes");
const enviosRoutes = require("./routes/envios.routes");
const recebimentosRoutes = require("./routes/recebimentos.routes");

const { tratarRotasManutencoes } = require("./routes/manutencoes.routes");
const { tratarRotasDashboard } = require("./routes/dashboard.routes");

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(cors());

app.get("/api/health", function (req, res) {
  res.status(200).json({
    status: "ok",
    mensagem: "Servidor Express funcionando.",
  });
});

app.use("/api/lojas", express.json(), lojasRoutes);

app.use("/api", estoquesRoutes);
app.use("/api/envios", express.json(), enviosRoutes);
app.use("/api/recebimentos", express.json(), recebimentosRoutes);

async function rotasLegadas(req, res, next) {
  try {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);

    const rotaManutencoesAtendida = await tratarRotasManutencoes(req, res, url);
    if (rotaManutencoesAtendida || res.headersSent) return;

    const rotaDashboardAtendida = await tratarRotasDashboard(req, res, url);
    if (rotaDashboardAtendida || res.headersSent) return;

    next();
  } catch (erro) {
    console.error("Erro nas rotas legadas:", erro);

    if (!res.headersSent) {
      enviarJson(res, 500, {
        mensagem: "Erro interno no servidor.",
      });
    }
  }
}

app.use(rotasLegadas);

app.use(function (req, res) {
  res.status(404).json({
    mensagem: "Rota não encontrada.",
  });
});

app.listen(PORTA, function () {
  console.log(`Servidor Express rodando em http://localhost:${PORTA}`);
});
