let timerAvisoSessao = null;
let timerLogoutSessao = null;
let modalAvisoSessaoAberto = false;
let ultimaRenovacaoSessaoEm = 0;

const TEMPO_AVISO_SESSAO_MS = 20 * 1000; //
const TEMPO_LOGOUT_SESSAO_MS = 60 * 1000; //
const INTERVALO_MINIMO_RENOVACAO_MS = 10 * 1000; //

function criarModalAvisoSessao() {
  if (document.getElementById("modalAvisoSessao")) {
    return;
  }

  const modal = document.createElement("div");
  modal.id = "modalAvisoSessao";
  modal.className = "modal-sessao hidden";

  modal.innerHTML = `
    <div class="modal-sessao-card">
      <h2>Sessão prestes a expirar</h2>
      <p>
        Você ficou inativo por alguns minutos.
        Deseja continuar conectado?
      </p>

      <div class="modal-sessao-actions">
        <button id="btnContinuarSessao" type="button" class="btn-primary">
          Continuar conectado
        </button>

        <button id="btnSairSessao" type="button" class="btn-secondary">
          Sair agora
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("btnContinuarSessao")
    .addEventListener("click", renovarSessaoPeloUsuario);

  document
    .getElementById("btnSairSessao")
    .addEventListener("click", function () {
      logout();
    });
}

function abrirModalAvisoSessao() {
  const modal = document.getElementById("modalAvisoSessao");

  if (!modal) {
    return;
  }
  modalAvisoSessaoAberto = true;
  modal.classList.remove("hidden");
}

function fecharModalAvisoSessao() {
  const modal = document.getElementById("modalAvisoSessao");

  if (!modal) {
    return;
  }

  modalAvisoSessaoAberto = false;
  modal.classList.add("hidden");
}

async function renovarSessaoAtiva() {
  const tokenAuth = localStorage.getItem("tokenAuth");

  if (!tokenAuth) {
    return;
  }

  const resposta = await fetch("http://localhost:3000/api/auth/sessao", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokenAuth}`,
    },
  });

  const dados = await resposta.json().catch(function () {
    return {};
  });

  if (resposta.status === 401) {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("tokenAuth");

    sessionStorage.setItem(
      "mensagemLogin",
      dados.erro || "Sua sessão expirou. Faça login novamente.",
    );

    window.location.href = "login.html";
    return;
  }

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao renovar sessão.");
  }

  ultimaRenovacaoSessaoEm = Date.now();

  return dados;
}

async function renovarSessaoPeloUsuario() {
  try {
    await renovarSessaoAtiva();

    fecharModalAvisoSessao();
    reiniciarControleInatividade();
  } catch (erro) {
    console.error("Erro ao renovar sessão:", erro);
    logout();
  }
}

function limparTimersSessao() {
  if (timerAvisoSessao) {
    clearTimeout(timerAvisoSessao);
  }

  if (timerLogoutSessao) {
    clearTimeout(timerLogoutSessao);
  }

  timerAvisoSessao = null;
  timerLogoutSessao = null;
}

function reiniciarControleInatividade() {
  if (!localStorage.getItem("tokenAuth")) {
    return;
  }

  if (modalAvisoSessaoAberto) {
    return;
  }

  limparTimersSessao();

  timerAvisoSessao = setTimeout(function () {
    abrirModalAvisoSessao();
  }, TEMPO_AVISO_SESSAO_MS);

  timerLogoutSessao = setTimeout(function () {
    logout();
  }, TEMPO_LOGOUT_SESSAO_MS);
}

function registrarAtividadeUsuario() {
  if (!localStorage.getItem("tokenAuth")) {
    return;
  }

  if (modalAvisoSessaoAberto) {
    return;
  }

  reiniciarControleInatividade();

  const agora = Date.now();

  if (agora - ultimaRenovacaoSessaoEm >= INTERVALO_MINIMO_RENOVACAO_MS) {
    ultimaRenovacaoSessaoEm = agora;

    renovarSessaoAtiva().catch(function (erro) {
      console.warn("Não foi possível renovar sessão por atividade:", erro);
    });
  }
}

function inicializarControleInatividadeSessao() {
  if (!localStorage.getItem("tokenAuth")) {
    return;
  }

  criarModalAvisoSessao();

  const eventos = ["click", "keydown", "mousemove", "scroll", "touchstart"];

  eventos.forEach(function (evento) {
    document.addEventListener(evento, registrarAtividadeUsuario, {
      passive: true,
    });
  });

  reiniciarControleInatividade();
}

function aplicarResponsividadeTabelas() {
  const tabelas = document.querySelectorAll(".responsive-table");

  tabelas.forEach(function (tabela) {
    const cabecalhos = tabela.querySelectorAll("thead th");
    const linhas = tabela.querySelectorAll("tbody tr");

    linhas.forEach(function (linha) {
      const colunas = linha.querySelectorAll("td");

      colunas.forEach(function (coluna, index) {
        if (cabecalhos[index]) {
          coluna.setAttribute("data-label", cabecalhos[index].textContent);
        }
      });
    });
  });
}

function buscarUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("usuarioLogado");

  if (!usuarioSalvo) {
    return null;
  }

  try {
    const usuario = JSON.parse(usuarioSalvo);

    if (!usuario || Array.isArray(usuario) || !usuario.id) {
      localStorage.removeItem("usuarioLogado");
      return null;
    }

    return usuario;
  } catch (erro) {
    console.error("Erro ao ler usuário logado:", erro);
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

function carregarUsuarioLogado() {
  const usuario = buscarUsuarioLogado();

  if (!usuario) {
    window.location.href = "login.html";
    return null;
  }

  const nomeUsuario = document.getElementById("nomeUsuario");

  if (nomeUsuario) {
    const nome = usuario.nome || "Usuário";
    const perfil = usuario.perfil || "Perfil não informado";

    nomeUsuario.textContent = `${nome} | Perfil: ${perfil}`;
  }

  aplicarPermissoesMenu();
  protegerPaginaAtual();

  return usuario;
}

function aplicarPermissoesMenu() {
  const usuario = buscarUsuarioLogado();

  if (!usuario) {
    return;
  }

  const permissoes = usuario.permissoes || [];
  const linksProtegidos = document.querySelectorAll("[data-permissao]");

  linksProtegidos.forEach(function (elemento) {
    const permissaoNecessaria = elemento.getAttribute("data-permissao");

    const linkReal = elemento.classList.contains("sidebar-link")
      ? elemento
      : elemento.closest(".sidebar-link");

    if (!linkReal || !permissaoNecessaria) {
      return;
    }

    if (!permissoes.includes(permissaoNecessaria)) {
      linkReal.style.display = "none";
    } else {
      linkReal.style.display = "flex";
    }
  });
}

function obterPermissaoPaginaAtual() {
  const paginaAtual = window.location.pathname.split("/").pop();

  const permissoesPorPagina = {
    "dashboard.html": "dashboard",
    "lojas.html": "lojas",
    "usuarios.html": "usuarios",
    "perfis.html": "perfis",
    "estoque.html": "estoque",
    "envios.html": "envios",
    "recebimentos.html": "recebimentos",
    "manutencao.html": "manutencao",
    "relatorios.html": "relatorios",
    "insights.html": "insights",
  };

  return permissoesPorPagina[paginaAtual];
}

function protegerPaginaAtual() {
  const usuario = buscarUsuarioLogado();

  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  const permissoes = usuario.permissoes || [];
  const permissaoDaPagina = obterPermissaoPaginaAtual();

  if (!permissaoDaPagina) {
    return;
  }

  if (!permissoes.includes(permissaoDaPagina)) {
    alert("Você não tem permissão para acessar esta página.");
    window.location.href = "dashboard.html";
  }
}

async function logout() {
  const tokenAuth = localStorage.getItem("tokenAuth");

  try {
    if (tokenAuth) {
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAuth}`,
        },
      });
    }
  } catch (erro) {
    console.warn("Não foi possível encerrar a sessão no backend:", erro);
  } finally {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("tokenAuth");
    sessionStorage.clear();

    window.location.href = "login.html";
  }
}

function abrirMenuMobile() {
  const sidebar = document.getElementById("sidebar");
  const menuOverlay = document.getElementById("menuOverlay");

  if (sidebar) {
    sidebar.classList.add("open");
  }

  if (menuOverlay) {
    menuOverlay.classList.add("open");
  }
}

function fecharMenuMobile() {
  const sidebar = document.getElementById("sidebar");
  const menuOverlay = document.getElementById("menuOverlay");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  if (menuOverlay) {
    menuOverlay.classList.remove("open");
  }
}

function criarAssistenteGlobal() {
  const assistenteExistente = document.getElementById("assistantSidebar");

  if (assistenteExistente) {
    return;
  }

  const botaoAssistente = document.createElement("button");
  botaoAssistente.classList.add("assistant-toggle");
  botaoAssistente.textContent = "Assistente IA";
  botaoAssistente.onclick = abrirAssistente;

  const overlay = document.createElement("div");
  overlay.id = "assistantOverlay";
  overlay.classList.add("assistant-overlay");
  overlay.onclick = fecharAssistente;

  const sidebar = document.createElement("aside");
  sidebar.id = "assistantSidebar";
  sidebar.classList.add("assistant-sidebar");

  sidebar.innerHTML = `
    <div class="assistant-header">
      <div>
        <h2>Assistente IA</h2>
        <p>Consulta inteligente do sistema</p>
      </div>

      <button class="assistant-close" onclick="fecharAssistente()">
        ×
      </button>
    </div>

 <div id="chatMessages" class="chat-messages">
  <div class="chat-message assistant">
    Olá! Posso responder sobre risco de estoque, histórico de insights e uso da IA.
  </div>
</div>

    <div class="assistant-suggestions">
  <button onclick="usarSugestao('Quais lojas estão com risco de falta de talões?')">
    Risco de estoque
  </button>

  <button onclick="usarSugestao('Mostre meu histórico de insights')">
    Histórico de insights
  </button>

  <button onclick="usarSugestao('Qual foi meu uso da IA?')">
    Uso da IA
  </button>
</div>

    <div class="chat-input-area">
      <input
        type="text"
        id="chatInput"
        class="form-input"
        placeholder="Digite sua pergunta..."
        onkeydown="verificarEnterAssistente(event)"
      />

      <button class="btn-primary" onclick="enviarPerguntaAssistente()">
        Enviar
      </button>
    </div>
  `;

  document.body.appendChild(botaoAssistente);
  document.body.appendChild(overlay);
  document.body.appendChild(sidebar);
}

async function consultarAssistenteIA(pergunta) {
  if (typeof apiFetch !== "function") {
    throw new Error(
      "apiFetch não está disponível. Verifique se api.js foi carregado antes de ui.js.",
    );
  }

  return await apiFetch("/api/ia/chat", {
    method: "POST",
    body: JSON.stringify({
      mensagem: pergunta,
    }),
  });
}

function abrirAssistente() {
  const sidebar = document.getElementById("assistantSidebar");
  const overlay = document.getElementById("assistantOverlay");

  if (sidebar) {
    sidebar.classList.add("open");
  }

  if (overlay) {
    overlay.classList.add("open");
  }
}

function fecharAssistente() {
  const sidebar = document.getElementById("assistantSidebar");
  const overlay = document.getElementById("assistantOverlay");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  if (overlay) {
    overlay.classList.remove("open");
  }
}

function usarSugestao(pergunta) {
  const input = document.getElementById("chatInput");

  if (input) {
    input.value = pergunta;
    enviarPerguntaAssistente();
  }
}

function verificarEnterAssistente(event) {
  if (event.key === "Enter") {
    enviarPerguntaAssistente();
  }
}

function escaparHtmlAssistente(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarTextoAssistente(texto) {
  const textoSeguro = escaparHtmlAssistente(texto);

  return textoSeguro
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*\*/g, "")
    .replace(/\n/g, "<br>");
}

function adicionarMensagemChat(texto, tipo) {
  const chatMessages = document.getElementById("chatMessages");

  if (!chatMessages) {
    return null;
  }

  const mensagem = document.createElement("div");
  mensagem.className = `chat-message ${tipo}`;
  mensagem.innerHTML = formatarTextoAssistente(texto);

  chatMessages.appendChild(mensagem);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return mensagem;
}

async function enviarPerguntaAssistente() {
  const input = document.getElementById("chatInput");

  if (!input) {
    return;
  }

  const pergunta = input.value.trim();

  if (pergunta === "") {
    return;
  }

  input.value = "";

  adicionarMensagemChat(pergunta, "user");

  const mensagemCarregando = adicionarMensagemChat(
    "Processando sua pergunta...",
    "assistant",
  );

  try {
    const resposta = await consultarAssistenteIA(pergunta);

    if (mensagemCarregando) {
      mensagemCarregando.remove();
    }

    adicionarMensagemChat(resposta.resposta, "assistant");

    console.log("ASSISTENTE IA:", resposta);
  } catch (erro) {
    console.error("Erro ao consultar assistente IA:", erro);

    if (mensagemCarregando) {
      mensagemCarregando.remove();
    }

    adicionarMensagemChat(
      erro.message || "Não foi possível consultar a assistente IA.",
      "assistant",
    );
  }
}

function mostrarToast(mensagem, erro = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${erro ? "toast-erro" : "toast-sucesso"}`;
  toast.textContent = mensagem;
  document.body.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("visivel");
  }, 10);

  setTimeout(function () {
    toast.classList.remove("visivel");

    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", function () {
  const temSidebar = document.getElementById("sidebar");

  if (temSidebar) {
    carregarUsuarioLogado();
    criarAssistenteGlobal();
    inicializarControleInatividadeSessao();
  }
});
