const AppError = require("../utils/AppError");
const { verificarTokenUsuario } = require("../utils/jwt");
const sessoesRepository = require("../repositories/sessoes.repository");

function calcularNovaExpiracaoSessao() {
  const minutos = Number(process.env.SESSION_TIMEOUT_MINUTES || 480);

  const expiracao = new Date();
  expiracao.setMinutes(expiracao.getMinutes() + minutos);

  return expiracao;
}

async function autenticarJWT(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new AppError("Token de autenticação não informado.", 401);
    }

    const match = authorization.trim().match(/^Bearer\s+(.+)$/i);

    if (!match) {
      throw new AppError("Formato do token inválido.", 401);
    }

    const token = match[1].trim();

    const payload = verificarTokenUsuario(token);

    if (!payload.jti) {
      throw new AppError("Sessao inválida. Faça login novamente.", 401);
    }

    const sessao = await sessoesRepository.buscarSessaoPorTokenSessao(
      payload.jti,
    );

    if (!sessao) {
      throw new AppError("Sessão não encontrada. Faça login novamente.", 401);
    }

    if (!sessao.ativo || sessao.encerradoEm) {
      throw new AppError("Sessão encerrada. Faça login novamente. ", 401);
    }

    const agora = new Date();
    const expiracaoSessao = new Date(sessao.expiracaoSessao);

    if (expiracaoSessao <= agora) {
      await sessoesRepository.encerrarSessaoPorTokenSessao(payload.jti);
      throw new AppError("Sessão expirada. Faça login novamente.", 401);
    }

    if (Number(sessao.usuarioId) !== Number(payload.sub)) {
      throw new AppError("Sessão incompativel com o usuário.", 401);
    }

    const sessaoRenovada = await sessoesRepository.renovarSessaoPorTokenSessao(
      payload.jti,
      calcularNovaExpiracaoSessao(),
    );

    if (!sessaoRenovada) {
      throw new AppError("Não foi possível renovar a sessão.", 401);
    }
    req.usuarioAutenticado = {
      id: Number(payload.sub),
      email: payload.email,
      nome: payload.nome,
    };

    req.sessaoAtual = {
      id: sessaoRenovada.id,
      tokenSessao: sessaoRenovada.tokenSessao,
      expiraEm: sessaoRenovada.expiracaoSessao,
    };

    return next();
  } catch (erro) {
    return next(erro);
  }
}

module.exports = autenticarJWT;
