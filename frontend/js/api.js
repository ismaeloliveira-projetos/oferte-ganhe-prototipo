const API_BASE_URL = "http://localhost:3000";

let redirecionamentoLoginEmAndamento = false;

function limparSessaoLocal() {
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("tokenAuth");
}

function redirecionarParaLoginComMensagem(mensagem) {
  if (redirecionamentoLoginEmAndamento) {
    return;
  }

  redirecionamentoLoginEmAndamento = true;

  const mensagemAtual = sessionStorage.getItem("mensagemLogin");

  limparSessaoLocal();

  sessionStorage.setItem(
    "mensagemLogin",
    mensagemAtual ||
      mensagem ||
      "Sua sessão expirou ou foi encerrada. Faça login novamente.",
  );

  window.location.href = "login.html";
}

function obterUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("usuarioLogado");

  if (!usuarioSalvo) {
    return null;
  }

  try {
    return JSON.parse(usuarioSalvo);
  } catch (erro) {
    console.error("Erro ao ler usuário logado:", erro);
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

function redirecionarParaLogin() {
  window.location.href = "login.html";
}

async function apiFetch(caminho, opcoes = {}) {
  const usuarioLogado = obterUsuarioLogado();
  const tokenAuth = localStorage.getItem("tokenAuth");

  if (!usuarioLogado || !usuarioLogado.id || !tokenAuth) {
    redirecionarParaLoginComMensagem(
      "Sua sessão não foi encontrada. Faça login novamente.",
    );

    throw new Error("Usuário não autenticado.");
  }

  const headers = {
    "Content-Type": "application/json",
    ...(tokenAuth ? { Authorization: `Bearer ${tokenAuth}` } : {}),
    ...(opcoes.headers || {}),
  };

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    ...opcoes,
    headers,
  });

  const dados = await resposta.json().catch(function () {
    return {};
  });

  if (resposta.status === 401) {
    redirecionarParaLoginComMensagem(
      dados.erro ||
        "Sua sessão expirou ou foi encerrada. Faça login novamente.",
    );

    throw new Error(dados.erro || "Sessão inválida.");
  }

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao buscar dados da API.");
  }

  return dados;
}
