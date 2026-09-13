const crypto = require("crypto");
const usuariosRepository = require("../repositories/usuarios.repository");
const recuperacoesSenhaRepository = require("../repositories/recuperacoes-senha.repository");
const { enviarEmailRedefinicaoSenha } = require("./email.service");
const sessoesRepository = require("../repositories/sessoes.repository");
const authRepository = require("../repositories/auth.repository");
const AppError = require("../utils/appError");
const { compararSenha, gerarHashSenha } = require("../utils/criptografia");
const { gerarTokenUsuario } = require("../utils/jwt");

function calcularExpiracaoRecuperacaoSenha() {
  const minutos = Number(process.env.PASSWORD_RESET_TOKEN_MINUTES || 30);

  const expiracao = new Date();
  expiracao.setMinutes(expiracao.getMinutes() + minutos);

  return expiracao;
}

function gerarTokenRecuperacaoSenha() {
  return crypto.randomBytes(32).toString("hex");
}

function gerarHashTokenRecuperacao(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function montarLinkRedefinicaoSenha(token) {
  const urlBase = process.env.FRONTEND_RESET_PASSWORD_URL;

  if (!urlBase) {
    throw new AppError("FRONTEND_RESET_PASSWORD_URL não configurada.", 500);
  }

  return `${urlBase}?token=${encodeURIComponent(token)}`;
}

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

async function logout(tokenSessao) {
  if (!tokenSessao) {
    throw new AppError("Sessão não informada para logout.", 400);
  }
  await sessoesRepository.encerrarSessaoPorTokenSessao(tokenSessao);

  return {
    mensagem: "Lougout realizado com sucesso.",
  };
}

async function solicitarRecuperacaoSenha(dados = {}, metadados = {}) {
  const email = String(dados.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw new AppError("E-mail é obrigatório.", 400);
  }

  const respostaGenerica = {
    mensagem:
      "Se o e-mail estiver cadastrado, enviaremos um link para redefinição de senha.",
  };

  const usuario = await authRepository.buscarUsuarioPorEmailComSenha(email);

  if (!usuario || usuario.ativo === false) {
    return respostaGenerica;
  }

  await recuperacoesSenhaRepository.invalidarRecuperacoesPendentesDoUsuario(
    usuario.id,
  );

  const token = gerarTokenRecuperacaoSenha();
  const tokenHash = gerarHashTokenRecuperacao(token);
  const dataExpiracao = calcularExpiracaoRecuperacaoSenha();

  await recuperacoesSenhaRepository.criarRecuperacaoSenha({
    usuarioId: usuario.id,
    tokenHash,
    dataExpiracao,
  });

  const link = montarLinkRedefinicaoSenha(token);

  await enviarEmailRedefinicaoSenha({
    para: usuario.email,
    nome: usuario.nome,
    link,
  });

  return respostaGenerica;
}

async function redefinirSenha(dados = {}) {
  const token = String(dados.token || "").trim();
  const novaSenha = String(dados.novaSenha || "").trim();

  if (!token) {
    throw new AppError("Token de redefinição é obrigatório.", 400);
  }

  if (!novaSenha) {
    throw new AppError("Nova senha é obrigatória.", 400);
  }

  if (novaSenha.length < 6) {
    throw new AppError("Nova senha deve ter pelo menos 6 caracteres.", 400);
  }

  const tokenHash = gerarHashTokenRecuperacao(token);

  const recuperacao =
    await recuperacoesSenhaRepository.buscarRecuperacaoValidaPorTokenHash(
      tokenHash,
    );

  if (!recuperacao) {
    throw new AppError("Token inválido, expirado ou já utilizado.", 400);
  }

  const senhaHash = gerarHashSenha(novaSenha);

  const usuarioAtualizado = await usuariosRepository.atualizarSenhaUsuarioPorId(
    recuperacao.usuarioId,
    senhaHash,
  );

  if (!usuarioAtualizado) {
    throw new AppError("Usuário não encontrado ou inativo.", 404);
  }

  await recuperacoesSenhaRepository.marcarRecuperacaoComoUsada(recuperacao.id);

  await sessoesRepository.encerrarSessoesAtivasDoUsuario(recuperacao.usuarioId);

  return {
    mensagem: "Senha redefinida com sucesso. Faça login novamente.",
  };
}

module.exports = {
  login,
  logout,
  solicitarRecuperacaoSenha,
  redefinirSenha,
};
