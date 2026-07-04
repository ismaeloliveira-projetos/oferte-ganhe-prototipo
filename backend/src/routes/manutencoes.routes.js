const express = require("express");
const manutencoesService = require("../services/manutencoes.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de manutenções:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/", async function (req, res) {
  try {
    const manutencoes = await manutencoesService.listarManutencoes();

    return res.status(200).json(manutencoes);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/", async function (req, res) {
  try {
    const manutencaoCriada = await manutencoesService.registrarManutencao(
      req.body,
    );

    return res.status(201).json(manutencaoCriada);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
