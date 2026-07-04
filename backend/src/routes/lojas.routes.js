const express = require("express");
const lojasService = require("../services/lojas.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de lojas:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/", async function (req, res) {
  try {
    const lojas = await lojasService.listarLojas();

    return res.status(200).json(lojas);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/", async function (req, res) {
  try {
    const lojaCriada = await lojasService.cadastrarLoja(req.body);

    return res.status(201).json(lojaCriada);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.put("/:codigoLoja", async function (req, res) {
  try {
    const lojaAtualizada = await lojasService.atualizarLoja(
      req.params.codigoLoja,
      req.body,
    );

    return res.status(200).json(lojaAtualizada);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.patch("/:codigoLoja/inativar", async function (req, res) {
  try {
    const lojaInativada = await lojasService.inativarLoja(
      req.params.codigoLoja,
    );

    return res.status(200).json(lojaInativada);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
