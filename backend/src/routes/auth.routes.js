const express = require("express");
const authService = require("../services/auth.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de autenticação:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.post("/login", async function (req, res) {
  try {
    const resultado = await authService.login(req.body);

    return res.status(200).json(resultado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
