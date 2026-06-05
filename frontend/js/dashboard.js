function obterStatusEstoque(loja) {
  if (loja.estoqueAtual <= loja.estoqueMinimo) {
    return "Crítico";
  }

  if (loja.estoqueAtual < loja.estoqueRecomendado) {
    return "Atenção";
  }

  return "Normal";
}

function obterClasseStatus(status) {
  if (status === "Crítico") {
    return "badge-critico";
  }

  if (status === "Atenção") {
    return "badge-atencao";
  }

  return "badge-normal";
}

function carregarUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("usuarioLogado");

  if (!usuarioSalvo) {
    window.location.href = "login.html";
    return;
  }

  const usuario = JSON.parse(usuarioSalvo);
  document.getElementById("nomeUsuario").textContent = usuario.nome;
}

function carregarCardsDashboard() {
  const totalLojas = lojasMockadas.length;

  const totalEstoque = lojasMockadas.reduce(function (total, loja) {
    return total + loja.estoqueAtual;
  }, 0);

  const lojasCriticas = lojasMockadas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Crítico";
  }).length;

  const enviosMes = enviosMockados.length;

  document.getElementById("totalLojas").textContent = totalLojas;
  document.getElementById("totalEstoque").textContent = totalEstoque;
  document.getElementById("lojasCriticas").textContent = lojasCriticas;
  document.getElementById("enviosMes").textContent = enviosMes;
}

function carregarTabelaLojasCriticas() {
  const tabela = document.getElementById("tabelaLojasCriticas");

  const lojasComAtencao = lojasMockadas.filter(function (loja) {
    const status = obterStatusEstoque(loja);
    return status === "Crítico" || status === "Atenção";
  });

  tabela.innerHTML = "";

  lojasComAtencao.forEach(function (loja) {
    const status = obterStatusEstoque(loja);
    const classeStatus = obterClasseStatus(status);

    tabela.innerHTML += `
      <tr>
        <td>${loja.codigo}</td>
        <td>${loja.nome}</td>
        <td>${loja.estoqueAtual}</td>
        <td>${loja.estoqueMinimo}</td>
        <td>${loja.estoqueRecomendado}</td>
        <td>
          <span class="badge-status ${classeStatus}">
            ${status}
          </span>
        </td>
      </tr>
    `;
  });
}

function carregarInsights() {
  const lista = document.getElementById("listaInsights");

  lista.innerHTML = "";

  insightsMockados.forEach(function (insight) {
    lista.innerHTML += `
      <div class="insight-item">
        <strong>Insight:</strong> ${insight}
      </div>
    `;
  });
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}



function abrirMenuMobile() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("menuOverlay").classList.add("open");
}

function fecharMenuMobile() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("open");
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
  document.getElementById("chatInput").value = pergunta;
  enviarPerguntaAssistente();
}

function verificarEnterAssistente(event) {
  if (event.key === "Enter") {
    enviarPerguntaAssistente();
  }
}

function responderPerguntaAssistente(pergunta) {
  const perguntaNormalizada = pergunta.toLowerCase();

  if (
    perguntaNormalizada.includes("abaixo do estoque") ||
    perguntaNormalizada.includes("estoque mínimo") ||
    perguntaNormalizada.includes("estoque minimo") ||
    perguntaNormalizada.includes("crítica") ||
    perguntaNormalizada.includes("critica")
  ) {
    const lojasCriticas = lojasMockadas.filter(function (loja) {
      return loja.estoqueAtual <= loja.estoqueMinimo;
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
    perguntaNormalizada.includes("total de talões enviados") ||
    perguntaNormalizada.includes("taloes enviados") ||
    perguntaNormalizada.includes("talões enviados") ||
    perguntaNormalizada.includes("envios")
  ) {
    const totalEnviado = enviosMockados.reduce(function (total, envio) {
      return total + envio.quantidade;
    }, 0);

    return `O total de talões enviados nos dados simulados é de ${totalEnviado} talões.`;
  }

  if (
    perguntaNormalizada.includes("total de lojas") ||
    perguntaNormalizada.includes("quantas lojas")
  ) {
    return `O sistema possui ${lojasMockadas.length} lojas cadastradas nos dados mockados.`;
  }

  if (
    perguntaNormalizada.includes("estoque total") ||
    perguntaNormalizada.includes("talões em estoque") ||
    perguntaNormalizada.includes("taloes em estoque")
  ) {
    const totalEstoque = lojasMockadas.reduce(function (total, loja) {
      return total + loja.estoqueAtual;
    }, 0);

    return `O estoque total atual é de ${totalEstoque} talões.`;
  }

  return "Ainda não tenho uma resposta para essa pergunta no protótipo. Na versão final, o assistente será integrado ao backend para consultar dados reais.";
}

function adicionarMensagemChat(texto, tipo) {
  const chatMessages = document.getElementById("chatMessages");

  chatMessages.innerHTML += `
    <div class="chat-message ${tipo}">
      ${texto}
    </div>
  `;

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function enviarPerguntaAssistente() {
  const input = document.getElementById("chatInput");
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


carregarUsuarioLogado();
carregarCardsDashboard();
carregarTabelaLojasCriticas();
carregarInsights();