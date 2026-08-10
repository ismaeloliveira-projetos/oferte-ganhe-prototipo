const express = require("express");
const consumosService = require("../services/consumos.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de consumos:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/", async function (req, res) {
  try {
    const consumos = await consumosService.listarConsumos(req.usuarioContexto);

    return res.status(200).json(consumos);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/", async function (req, res) {
  try {
    const consumo = await consumosService.registrarConsumo(
      req.body,
      req.usuarioContexto,
    );

    return res.status(201).json(consumo);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
