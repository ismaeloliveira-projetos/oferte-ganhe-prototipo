const express = require("express");
const estoquesService = require("../services/estoques.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de estoques:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/estoques", async function (req, res) {
  try {
    const estoques = await estoquesService.listarEstoques();

    return res.status(200).json(estoques);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/movimentacoes-estoque", async function (req, res) {
  try {
    const movimentacoes = await estoquesService.listarMovimentacoes({
      lojaId: req.query.lojaId,
    });

    return res.status(200).json(movimentacoes);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
