const authRepository = require("../repositories/auth.repository");
const AppError = require("../utils/AppError");
const { compararSenha } = require("../utils/criptografia");

function montarUsuarioLogado(usuario, perfis, permissoes, lojas) {
  const perfilPrincipal = perfis[0] || null;
  const permissoesLista = permissoes.map(function (item) {
    return item.permissao;
  });

  const escopo = lojas.length === 0 ? "TODAS_AS_LOJAS" : "LOJAS_ESPECIFICAS";

  return {
    id: usuario.id,
    nome: usuario.nome,
    matricula: usuario.matricula,
    email: usuario.email,

    perfilId: perfilPrincipal ? perfilPrincipal.id : null,
    perfil: perfilPrincipal ? perfilPrincipal.nomePerfil : null,
    nivel: perfilPrincipal ? Number(perfilPrincipal.nivel) : null,

    perfis,
    permissoes: permissoesLista,

    escopo,
    lojas,

    lojaId: lojas.length > 0 ? lojas[0].codigoLoja : null,
    lojaBancoId: lojas.length > 0 ? lojas[0].id : null,
  };
}

async function login(dados = {}) {
  const email = String(dados.email || "")
    .trim()
    .toLowerCase();

  const senha = String(dados.senha || "").trim();

  if (!email) {
    throw new AppError("E-mail é obrigatório.", 400);
  }

  if (!senha) {
    throw new AppError("Senha é obrigatória.", 400);
  }

  const usuario = await authRepository.buscarUsuarioPorEmailComSenha(email);

  if (!usuario) {
    throw new AppError("E-mail ou senha inválidos.", 401);
  }

  if (usuario.ativo === false) {
    throw new AppError("Usuário inativo. Contate o administrador.", 403);
  }

  const senhaCorreta = compararSenha(senha, usuario.senha_hash);

  if (!senhaCorreta) {
    throw new AppError("E-mail ou senha inválidos.", 401);
  }

  const perfis = await authRepository.listarPerfisDoUsuario(usuario.id);

  if (perfis.length === 0) {
    throw new AppError("Usuário sem perfil de acesso vinculado.", 403);
  }

  const permissoes = await authRepository.listarPermissoesDoUsuario(usuario.id);
  const lojas = await authRepository.listarLojasDoUsuario(usuario.id);

  const usuarioLogado = montarUsuarioLogado(usuario, perfis, permissoes, lojas);

  return {
    mensagem: "Login realizado com sucesso.",
    usuario: usuarioLogado,
  };
}

module.exports = {
  login,
};
