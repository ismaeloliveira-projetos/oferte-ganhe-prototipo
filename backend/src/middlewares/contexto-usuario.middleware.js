const usuariosRepository = require("../repositories/usuarios.repository");

async function contextoUsuarioMiddleware(req, res, next) {
  try {
    const usuarioAutenticado = req.usuarioAutenticado;

    if (!usuarioAutenticado || !usuarioAutenticado.id) {
      return res.status(401).json({
        erro: "Usuário não autenticado.",
      });
    }

    const usuarioId = Number(usuarioAutenticado.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(401).json({
        erro: "Usuário autenticado inválido.",
      });
    }

    const usuario = await usuariosRepository.buscarUsuarioPorId(usuarioId);

    if (!usuario || usuario.ativo === false) {
      return res.status(401).json({
        erro: "Usuário inválido ou inativo.",
      });
    }

    // daqui para baixo você mantém o resto da função
    // Carregar as lojas do usuário
    //aqui é buscado as lojas do usuário para determinar se ele tem acesso global ou restrito a lojas específicas.
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
