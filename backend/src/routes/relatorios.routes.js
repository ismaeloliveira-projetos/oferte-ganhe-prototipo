const express = require("express");
const relatoriosService = require("../services/relatorios.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de relatórios:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/", async function (req, res) {
  try {
    return res.status(200).json({
      mensagem: "Módulo de relatórios disponível.",
      rotas: [
        "/api/relatorios/resumo",
        "/api/relatorios/usuarios",
        "/api/relatorios/perfis",
        "/api/relatorios/lojas",
        "/api/relatorios/estoque",
        "/api/relatorios/envios",
        "/api/relatorios/recebimentos",
        "/api/relatorios/manutencoes",
        "/api/relatorios/movimentacoes",
      ],
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/resumo", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarResumoRelatorios(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/usuarios", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioUsuarios();

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/perfis", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioPerfis();

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/lojas", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioLojas(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/estoque", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEstoque(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/estoques", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEstoque(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/envios", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEnvios(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/recebimentos", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioRecebimentos(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/manutencoes", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioManutencoes(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/movimentacoes", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioMovimentacoes(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
