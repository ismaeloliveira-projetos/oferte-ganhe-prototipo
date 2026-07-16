const express = require("express");

const iaService = require("../services/ia.service");

const router = express.Router();

router.get("/health", async function (req, res) {
  try {
    const resultado = await iaService.verificarSaudeIa();

    res.status(200).json({
      mensagem: "Serviço de IA acessível pelo Node.",
      dados: resultado,
    });
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao comunicar com o serviço de IA.",
      detalhe: erro.message,
    });
  }
});

router.get("/insights/estoque/risco", async function (req, res) {
  try {
    const resultado = await iaService.gerarInsightRiscoEstoque();

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao gerar insight de risco de estoque.",
      detalhe: erro.message,
    });
  }
});

module.exports = router;
