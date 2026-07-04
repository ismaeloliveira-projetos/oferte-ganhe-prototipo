const express = require("express");
const dashboardService = require("../services/dashboard.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de dashboard:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/resumo", async function (req, res) {
  try {
    const resumo = await dashboardService.buscarResumoDashboard();

    return res.status(200).json(resumo);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
