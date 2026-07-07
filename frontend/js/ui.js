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

function logout() {
  localStorage.removeItem("usuarioLogado");
  sessionStorage.clear();
  window.location.href = "login.html";
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
        Olá! Você pode perguntar, por exemplo:
        "Quais lojas estão abaixo do estoque mínimo?"
      </div>
    </div>

    <div class="assistant-suggestions">
      <button onclick="usarSugestao('Quais lojas estão abaixo do estoque mínimo?')">
        Lojas abaixo do mínimo
      </button>

      <button onclick="usarSugestao('Qual foi o total de talões enviados?')">
        Total enviado
      </button>

      <button onclick="usarSugestao('Quantas lojas existem?')">
        Total de lojas
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

function adicionarMensagemChat(texto, tipo) {
  const chatMessages = document.getElementById("chatMessages");

  if (!chatMessages) {
    return;
  }

  chatMessages.innerHTML += `
    <div class="chat-message ${tipo}">
      ${texto}
    </div>
  `;

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function responderPerguntaAssistente(pergunta) {
  const perguntaNormalizada = pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    perguntaNormalizada.includes("abaixo") ||
    perguntaNormalizada.includes("minimo") ||
    perguntaNormalizada.includes("critico")
  ) {
    return "Essa consulta será conectada aos dados reais do backend na etapa de Insights IA.";
  }

  if (
    perguntaNormalizada.includes("total") ||
    perguntaNormalizada.includes("envios") ||
    perguntaNormalizada.includes("lojas") ||
    perguntaNormalizada.includes("estoque")
  ) {
    return "Os dados reais já estão no backend. A próxima etapa é conectar o assistente à API de insights.";
  }

  return "Ainda não tenho uma resposta específica para essa pergunta. Em breve este assistente será conectado ao backend.";
}

function enviarPerguntaAssistente() {
  const input = document.getElementById("chatInput");

  if (!input) {
    return;
  }

  const pergunta = input.value.trim();

  if (pergunta === "") {
    return;
  }

  adicionarMensagemChat(pergunta, "user");

  const resposta = responderPerguntaAssistente(pergunta);

  setTimeout(function () {
    adicionarMensagemChat(resposta, "assistant");
  }, 500);

  input.value = "";
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
  }
});
