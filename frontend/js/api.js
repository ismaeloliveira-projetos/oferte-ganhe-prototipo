const API_BASE_URL = "http://localhost:3000";

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

  if (!usuarioLogado || !usuarioLogado.id) {
    redirecionarParaLogin();
    throw new Error("Usuário não autenticado.");
  }

  const headers = {
    "Content-Type": "application/json",
    ...(opcoes.headers || {}),
    "x-usuario-id": String(usuarioLogado.id),
  };

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    ...opcoes,
    headers,
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    if (resposta.status === 401) {
      localStorage.removeItem("usuarioLogado");
      redirecionarParaLogin();
    }

    throw new Error(dados.erro || "Erro ao buscar dados da API.");
  }

  return dados;
}
