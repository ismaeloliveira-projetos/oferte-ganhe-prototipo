// Funções para criptografia de senhas
const crypto = require("crypto");

function gerarHashSenha(senha) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto.scryptSync(String(senha), salt, 64).toString("hex");

  return `${salt}:${hash}`;
}
// Função para comparar a senha informada com a senha hash salva no banco de dados
function compararSenha(senha, senhaHashSalva) {
  const [salt, hashOriginal] = String(senhaHashSalva).split(":");

  if (!salt || !hashOriginal) {
    return false;
  }

  const hashInformado = crypto
    .scryptSync(String(senha), salt, 64)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hashOriginal, "hex"),
    Buffer.from(hashInformado, "hex"),
  );
}

module.exports = {
  gerarHashSenha,
  compararSenha,
};
