const express = require("express");
const perfisService = require("../services/perfis.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de perfis:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/", async function (req, res) {
  try {
    const perfis = await perfisService.listarPerfis();

    return res.status(200).json(perfis);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/", async function (req, res) {
  try {
    const perfilCriado = await perfisService.cadastrarPerfil(req.body);

    return res.status(201).json(perfilCriado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.put("/:id", async function (req, res) {
  try {
    const perfilAtualizado = await perfisService.atualizarPerfil(
      req.params.id,
      req.body,
    );

    return res.status(200).json(perfilAtualizado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.patch("/:id/inativar", async function (req, res) {
  try {
    const perfilInativado = await perfisService.inativarPerfil(req.params.id);

    return res.status(200).json(perfilInativado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/usuarios/:usuarioId", async function (req, res) {
  try {
    const perfis = await perfisService.listarPerfisDoUsuario(
      req.params.usuarioId,
    );

    return res.status(200).json(perfis);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/usuarios/:usuarioId", async function (req, res) {
  try {
    const vinculoCriado = await perfisService.vincularPerfilAoUsuario(
      req.params.usuarioId,
      req.body,
    );

    return res.status(201).json(vinculoCriado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.delete("/usuarios/:usuarioId/:perfilId", async function (req, res) {
  try {
    const vinculoRemovido = await perfisService.removerPerfilDoUsuario(
      req.params.usuarioId,
      req.params.perfilId,
    );

    return res.status(200).json(vinculoRemovido);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
