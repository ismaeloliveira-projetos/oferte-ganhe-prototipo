const express = require("express");
const recebimentosService = require("../services/recebimentos.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de recebimentos:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/", async function (req, res) {
  try {
    const recebimentos = await recebimentosService.listarRecebimentos(
      req.usuarioContexto,
    );

    return res.status(200).json(recebimentos);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/", async function (req, res) {
  try {
    const recebimento = await recebimentosService.confirmarRecebimento(
      req.body,
      req.usuarioContexto,
    );

    return res.status(201).json(recebimento);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
