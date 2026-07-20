const jwt = require("jsonwebtoken");
const AppError = require("./appError");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function validarConfiguracaoJWT() {
  if (!JWT_SECRET) {
    throw new AppError("JWT_SECRET não configurado no servidor.", 500);
  }
}

function gerarTokenUsuario(usuario) {
  validarConfiguracaoJWT();

  return jwt.sign(
    {
      sub: String(usuario.id),
      email: usuario.email,
      nome: usuario.nome,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

function verificarTokenUsuario(token) {
  validarConfiguracaoJWT();

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (erro) {
    throw new AppError("Token invalido ou expirado.", 401);
  }
}

module.exports = {
  gerarTokenUsuario,
  verificarTokenUsuario,
};
