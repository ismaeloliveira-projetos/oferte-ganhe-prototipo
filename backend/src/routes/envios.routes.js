const express = require("express");
const enviosService = require("../services/envios.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de envios:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/", async function (req, res) {
  try {
    const envios = await enviosService.listarEnvios(req.usuarioContexto);

    return res.status(200).json(envios);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/", async function (req, res) {
  try {
    const envio = await enviosService.cadastrarEnvio(
      req.body,
      req.usuarioContexto,
    );

    return res.status(201).json(envio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
