const express = require("express");
const usuariosService = require("../services/usuarios.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de usuários:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

router.get("/", async function (req, res) {
  try {
    const usuarios = await usuariosService.listarUsuarios();

    return res.status(200).json(usuarios);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.post("/", async function (req, res) {
  try {
    const usuarioCriado = await usuariosService.cadastrarUsuario(req.body);

    return res.status(201).json(usuarioCriado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.put("/:id", async function (req, res) {
  try {
    const usuarioAtualizado = await usuariosService.atualizarUsuario(
      req.params.id,
      req.body,
    );

    return res.status(200).json(usuarioAtualizado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.patch("/:id/inativar", async function (req, res) {
  try {
    const usuarioInativado = await usuariosService.inativarUsuario(
      req.params.id,
    );

    return res.status(200).json(usuarioInativado);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
