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

  const usuario = JSON.parse(usuarioSalvo);

  if (Array.isArray(usuario)) {
    localStorage.removeItem("usuarioLogado");
    return null;
  }

  return usuario;
}

function carregarUsuarioLogado() {
  const usuario = buscarUsuarioLogado();

  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  const nomeUsuario = document.getElementById("nomeUsuario");

  if (nomeUsuario) {
    const nome = usuario.nome || "Usuário";
    const perfil = usuario.perfil || "Perfil não informado";

    nomeUsuario.textContent = `${nome} | Perfil: ${perfil}`;
  }

  aplicarPermissoesMenu();
  protegerPaginaAtual();
}

function aplicarPermissoesMenu() {
  const usuario = buscarUsuarioLogado();

  if (!usuario) {
    return;
  }

  const permissoes = usuario.permissoes || [];
  const linksProtegidos = document.querySelectorAll("[data-permissao]");

  linksProtegidos.forEach(function (link) {
    const permissaoNecessaria = link.getAttribute("data-permissao");

    // Encontra o <a> parent se for um <span>
    const elementoReal = link.classList.contains("sidebar-link")
      ? link
      : link.closest(".sidebar-link");

    if (!permissoes.includes(permissaoNecessaria)) {
      if (elementoReal) elementoReal.style.display = "none";
    } else {
      if (elementoReal) elementoReal.style.display = "flex";
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

document.addEventListener("DOMContentLoaded", function () {
  const temSidebar = document.getElementById("sidebar");

  if (temSidebar) {
    carregarUsuarioLogado();
    criarAssistenteGlobal();
  }
});
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
  document.getElementById("assistantSidebar").classList.add("open");
  document.getElementById("assistantOverlay").classList.add("open");
}

function fecharAssistente() {
  document.getElementById("assistantSidebar").classList.remove("open");
  document.getElementById("assistantOverlay").classList.remove("open");
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

function obterDadosBancoFake() {
  const banco = carregarBanco();

  return {
    lojas: banco.lojas || [],
    envios: banco.envios || [],
    recebimentos: banco.recebimentos || [],
    manutencoes: banco.manutencoes || [],
  };
}

function obterEstoqueAtualAssistente(loja) {
  return Number(
    loja.estoqueAtual ??
      loja.quantidadeAtual ??
      loja.recomendado ??
      loja.estoqueRecomendado ??
      0,
  );
}

function obterEstoqueMinimoAssistente(loja) {
  return Number(loja.estoqueMinimo ?? loja.minimo ?? 0);
}

function responderPerguntaAssistente(pergunta) {
  const dados = obterDadosBancoFake();

  const perguntaNormalizada = pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    perguntaNormalizada.includes("abaixo") ||
    perguntaNormalizada.includes("minimo") ||
    perguntaNormalizada.includes("critico")
  ) {
    const lojasCriticas = dados.lojas.filter(function (loja) {
      return (
        obterEstoqueAtualAssistente(loja) <= obterEstoqueMinimoAssistente(loja)
      );
    });

    if (lojasCriticas.length === 0) {
      return "No momento, nenhuma loja está abaixo do estoque mínimo.";
    }

    const nomesLojas = lojasCriticas
      .map(function (loja) {
        return `${loja.codigo} - ${loja.nome}`;
      })
      .join(", ");

    return `As lojas abaixo do estoque mínimo são: ${nomesLojas}.`;
  }

  if (
    perguntaNormalizada.includes("total de taloes enviados") ||
    perguntaNormalizada.includes("taloes enviados") ||
    perguntaNormalizada.includes("talões enviados") ||
    perguntaNormalizada.includes("envios")
  ) {
    const totalEnviado = dados.envios.reduce(function (total, envio) {
      return total + Number(envio.quantidade || envio.quantidadeEnviada || 0);
    }, 0);

    return `O total de talões enviados registrados no sistema é de ${totalEnviado} talões.`;
  }

  if (
    perguntaNormalizada.includes("total de lojas") ||
    perguntaNormalizada.includes("quantas lojas")
  ) {
    return `O sistema possui ${dados.lojas.length} lojas cadastradas.`;
  }

  if (
    perguntaNormalizada.includes("estoque total") ||
    perguntaNormalizada.includes("taloes em estoque") ||
    perguntaNormalizada.includes("talões em estoque")
  ) {
    const totalEstoque = dados.lojas.reduce(function (total, loja) {
      return total + obterEstoqueAtualAssistente(loja);
    }, 0);

    return `O estoque total atual é de ${totalEstoque} talões.`;
  }

  if (
    perguntaNormalizada.includes("recebimentos") ||
    perguntaNormalizada.includes("recebido")
  ) {
    return `O sistema possui ${dados.recebimentos.length} recebimento(s) registrado(s).`;
  }

  if (
    perguntaNormalizada.includes("manutencao") ||
    perguntaNormalizada.includes("manutenção")
  ) {
    return `O sistema possui ${dados.manutencoes.length} manutenção(ões) registrada(s).`;
  }

  return "Ainda não tenho uma resposta específica para essa pergunta no protótipo. Posso responder sobre lojas críticas, total enviado, total de lojas, estoque total, recebimentos e manutenções.";
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

const TIMEOUT_SEGUNDOS = 10;
const AVISO_ANTES_SEGUNDOS = 5;
const CHAVE_SESSAO = "og_sessao";

let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado")) || null;

function logout() {
  pararTimerSessao();
  sessionStorageSeguro("clear");
  localStorage.removeItem("usuarioLogado");
  usuarioLogado = null;
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
  const temSidebar = document.getElementById("sidebar");

  if (temSidebar) {
    carregarUsuarioLogado();
    criarAssistenteGlobal();
  }

  if (usuarioLogado) {
    iniciarSessao();
  } else {
    window.location.href = "../index.html";
  }
});

let segundosRestantes = TIMEOUT_SEGUNDOS;
let intervaloSessao = null;
let modalTimeoutAberto = false;

function injetarModalTimeout() {
  const modal = document.createElement("div");
  modal.id = "modalTimeout";
  modal.className = "modal-overlay";
  modal.innerHTML = `
  <div class="modal-caixa">
    <h2>⚠️ Sessão prestes a expirar</h2>
    <p>Sua sessão vai encerrar em <strong id="contagemTimeout">60</strong> segundos por inatividade.</p>
    <div class="modal-botoes">
      <button class="btn-primary" onclick="continuarSessao()">Continuar sessão</button>
      <button class="btn-primary" onclick="logout()">Sair agora</button>
    </div>
  </div>
`;
  document.body.appendChild(modal);
}

function iniciarSessao() {
  injetarModalTimeout();
  sessionStorageSeguro("set", {
    usuarioId: usuarioLogado.id,
    inicio: Date.now(),
  });
  resetarContadorInatividade();
  pararTimerSessao();
  intervaloSessao = setInterval(tickSessao, 1000);

  ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((evt) => {
    document.addEventListener(evt, resetarContadorInatividade, {
      passive: true,
    });
  });
}

function pararTimerSessao() {
  if (intervaloSessao) clearInterval(intervaloSessao);
  intervaloSessao = null;
}

function resetarContadorInatividade() {
  if (!usuarioLogado) return;
  segundosRestantes = TIMEOUT_SEGUNDOS;
  if (modalTimeoutAberto) {
    continuarSessao();
  }
  atualizarVisorTimer();
}

function tickSessao() {
  if (!usuarioLogado) return;
  segundosRestantes--;
  atualizarVisorTimer();

  if (
    segundosRestantes <= AVISO_ANTES_SEGUNDOS &&
    segundosRestantes > 0 &&
    !modalTimeoutAberto
  ) {
    abrirModalTimeout();
  }

  if (modalTimeoutAberto) {
    document.getElementById("contagemTimeout").textContent = Math.max(
      segundosRestantes,
      0,
    );
  }

  // if (segundosRestantes <= 0) {
  // pararTimerSessao();
  // fecharModalTimeout();
  //logout();
  // alert("Sessão encerrada por inatividade.");
  // }
}

function atualizarVisorTimer() {}

function abrirModalTimeout() {
  modalTimeoutAberto = true;
  document.getElementById("contagemTimeout").textContent = segundosRestantes;
  document.getElementById("modalTimeout").classList.add("ativo");
}

function fecharModalTimeout() {
  modalTimeoutAberto = false;
  document.getElementById("modalTimeout").classList.remove("ativo");
}

function continuarSessao() {
  fecharModalTimeout();
  segundosRestantes = TIMEOUT_SEGUNDOS;
  atualizarVisorTimer();
}

function sessionStorageSeguro(acao, valor) {
  try {
    if (acao === "set") {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(valor));
      return;
    }
    if (acao === "clear") {
      sessionStorage.removeItem(CHAVE_SESSAO);
      return;
    }
    if (acao === "get") {
      const v = sessionStorage.getItem(CHAVE_SESSAO);
      return v ? JSON.parse(v) : null;
    }
  } catch (e) {
    return null;
  }
}

function mostrarToast(mensagem, erro = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${erro ? "toast-erro" : "toast-sucesso"}`;
  toast.textContent = mensagem;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("visivel"), 10);
  setTimeout(() => {
    toast.classList.remove("visivel");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
