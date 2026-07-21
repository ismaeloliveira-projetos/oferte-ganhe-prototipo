const express = require("express");
const authService = require("../services/auth.service");
const autenticarJWT = require("../middlewares/autenticacao.middleware");

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
    const resultado = await authService.login(req.body, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json(resultado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/logout", autenticarJWT, async function (req, res) {
  try {
    const resultado = await authService.logout(req.sessaoAtual.tokenSessao);

    return res.status(200).json(resultado);
  } catch (erro) {
    if (erro.statusCode) {
      return res.status(erro.statusCode).json({
        erro: erro.message,
      });
    }

    console.error("Erro interno na rota de logout:", erro);

    return res.status(500).json({
      erro: "Erro interno ao realizar logout.",
    });
  }
});

module.exports = router;
