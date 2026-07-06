const express = require("express");
const cors = require("cors");

const lojasRoutes = require("./routes/lojas.routes");
const estoquesRoutes = require("./routes/estoques.routes");
const enviosRoutes = require("./routes/envios.routes");
const recebimentosRoutes = require("./routes/recebimentos.routes");
const manutencoesRoutes = require("./routes/manutencoes.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const perfisRoutes = require("./routes/perfis.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", function (req, res) {
  res.status(200).json({
    status: "ok",
    mensagem: "Servidor Express funcionando.",
  });
});

app.use("/api/lojas", lojasRoutes);
app.use("/api", estoquesRoutes);
app.use("/api/envios", enviosRoutes);
app.use("/api/recebimentos", recebimentosRoutes);
app.use("/api/manutencoes", manutencoesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/perfis", perfisRoutes);
app.use("/api/auth", authRoutes);

app.use(function (req, res) {
  res.status(404).json({
    mensagem: "Rota não encontrada.",
  });
});

app.listen(PORTA, function () {
  console.log(`Servidor Express rodando em http://localhost:${PORTA}`);
});
