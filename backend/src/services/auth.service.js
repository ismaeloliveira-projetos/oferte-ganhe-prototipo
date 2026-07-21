const crypto = require("crypto");
const sessoesRepository = require("../repositories/sessoes.repository");
const authRepository = require("../repositories/auth.repository");
const AppError = require("../utils/AppError");
const { compararSenha } = require("../utils/criptografia");
const { gerarTokenUsuario } = require("../utils/jwt");

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

function calcularExpiracaoSessao() {
  const minutos = Number(process.env.SESSION_TIMEOUT_MINUTES || 480);

  const expiracao = new Date();
  expiracao.setMinutes(expiracao.getMinutes() + minutos);

  return expiracao;
}

function obterDescricaoDispositivo(userAgent) {
  const texto = String(userAgent || "Dispositivo desconhecido");

  return texto.slice(0, 150);
}

async function login(dados = {}, metadados = {}) {
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

  // Proteção contra múltiplos acessos:
  // ao fazer novo login, encerra sessões antigas do mesmo usuário.
  await sessoesRepository.encerrarSessoesAtivasDoUsuario(usuarioLogado.id);

  const tokenSessao = crypto.randomUUID();
  const expiracaoSessao = calcularExpiracaoSessao();

  await sessoesRepository.criarSessaoUsuario({
    usuarioId: usuarioLogado.id,
    tokenSessao,
    dispositivo: obterDescricaoDispositivo(metadados.userAgent),
    expiracaoSessao,
  });

  const token = gerarTokenUsuario(usuarioLogado, tokenSessao);

  return {
    mensagem: "Login realizado com sucesso.",
    usuario: usuarioLogado,
    token,
    sessao: {
      expiraEm: expiracaoSessao,
    },
  };
}

module.exports = {
  login,
};
