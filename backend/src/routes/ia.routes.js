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
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const resultado =
      await iaService.gerarInsightRiscoEstoque(contextoUsuarioIa);

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao gerar insight de risco de estoque.",
      detalhe: erro.message,
    });
  }
});

router.get("/insights/historico", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const limite = Number(req.query.limite) || 20;

    const resultado = await iaService.listarHistoricoInsights(
      contextoUsuarioIa,
      limite,
    );

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao buscar histórico de insights.",
      detalhe: erro.message,
    });
  }
});

router.post("/insights/feedback", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const resultado = await iaService.registrarFeedbackInsight(
      contextoUsuarioIa,
      req.body,
    );

    res.status(201).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao registrar feedback do insight.",
      detalhe: erro.message,
    });
  }
});

router.get("/resumo", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    if (!contextoUsuarioIa.usuario_id) {
      return res.status(400).json({
        mensagem: "Usuário não identificado para consultar resumo da IA.",
      });
    }

    const resultado = await iaService.obterResumoUsoIa(contextoUsuarioIa);

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao buscar resumo de uso da IA.",
      detalhe: erro.message,
    });
  }
});

module.exports = router;
