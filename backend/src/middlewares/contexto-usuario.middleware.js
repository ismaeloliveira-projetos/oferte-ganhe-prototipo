const usuariosRepository = require("../repositories/usuarios.repository");

async function contextoUsuarioMiddleware(req, res, next) {
  try {
    const usuarioId = req.headers["x-usuario-id"];

    if (!usuarioId) {
      return res.status(401).json({
        erro: "Usuário não autenticado.",
      });
    }

    const usuario = await usuariosRepository.buscarUsuarioPorId(
      Number(usuarioId),
    );

    if (!usuario || usuario.ativo === false) {
      return res.status(401).json({
        erro: "Usuário inválido ou inativo.",
      });
    }

    const lojas = await usuariosRepository.listarLojasDoUsuario(usuario.id);

    req.usuarioContexto = {
      id: usuario.id,
      nome: usuario.nome,
      acessoGlobal: lojas.length === 0,
      lojasIds: lojas.map(function (loja) {
        return loja.id;
      }),
      lojas,
    };

    next();
  } catch (erro) {
    console.error("Erro no middleware de contexto do usuário:", erro);

    return res.status(500).json({
      erro: "Erro ao carregar contexto do usuário.",
    });
  }
}

module.exports = contextoUsuarioMiddleware;
