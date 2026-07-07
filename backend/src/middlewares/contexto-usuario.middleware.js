const usuariosRepository = require("../repositories/usuarios.repository");

async function contextoUsuarioMiddleware(req, res, next) {
  try {
    const usuarioIdHeader = req.headers["x-usuario-id"];

    if (!usuarioIdHeader) {
      return res.status(401).json({
        erro: "Usuário não autenticado. Informe o header x-usuario-id.",
      });
    }

    const usuarioId = Number(usuarioIdHeader);

    if (Number.isNaN(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({
        erro: "Header x-usuario-id deve ser um número válido.",
      });
    }

    const usuario = await usuariosRepository.buscarUsuarioPorId(usuarioId);

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

    return next();
  } catch (erro) {
    console.error("Erro no middleware de contexto do usuário:", erro);

    return res.status(500).json({
      erro: "Erro ao carregar contexto do usuário.",
    });
  }
}

module.exports = contextoUsuarioMiddleware;
