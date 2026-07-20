const AppError = require("../utils/AppError");
const { verificarTokenUsuario } = require("../utils/jwt");

function autenticarJWT(req, res, next) {
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

  req.usuarioAutenticado = {
    id: Number(payload.sub),
    email: payload.email,
    nome: payload.nome,
  };

  next();
}

module.exports = autenticarJWT;
