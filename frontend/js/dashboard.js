const API_URL = "http://localhost:3000/api/dashboard/resumo";

function obterClasseStatus(status) {
  if (status === "Crítico") {
    return "badge-critico";
  }

  if (status === "Atenção") {
    return "badge-atencao";
  }

  return "badge-normal";
}

async function buscarResumoDashboard() {
  const resposta = await fetch(API_URL);

  if (!resposta.ok) {
    throw new Error("Erro ao buscar dados do dashboard.");
  }

  return await resposta.json();
}

function carregarCardsDashboard(dados) {
  document.getElementById("totalLojas").textContent = dados.totalLojas;
  document.getElementById("totalEstoque").textContent = dados.totalEstoque;
  document.getElementById("lojasCriticas").textContent = dados.lojasCriticas;
  document.getElementById("enviosMes").textContent = dados.enviosMes;
}

function carregarTabelaLojasCriticas(dados) {
  const tabela = document.getElementById("tabelaLojasCriticas");

  if (!tabela) {
    return;
  }

  tabela.innerHTML = "";

  if (!dados.lojasAtencao || dados.lojasAtencao.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6">Nenhuma loja em situação crítica ou de atenção.</td>
      </tr>
    `;
    return;
  }

  dados.lojasAtencao.forEach(function (loja) {
    const classeStatus = obterClasseStatus(loja.statusEstoque);

    tabela.innerHTML += `
      <tr>
        <td>${loja.codigoLoja || "-"}</td>
        <td>${loja.nomeLoja || "Loja sem nome"}</td>
        <td>${loja.estoqueAtual}</td>
        <td>${loja.estoqueMinimo}</td>
        <td>${loja.estoqueRecomendado}</td>
        <td>
          <span class="badge-status ${classeStatus}">
            ${loja.statusEstoque}
          </span>
        </td>
      </tr>
    `;
  });

  if (typeof aplicarResponsividadeTabelas === "function") {
    aplicarResponsividadeTabelas();
  }
}

function carregarInsights(dados) {
  const lista = document.getElementById("listaInsights");

  if (!lista) {
    return;
  }

  lista.innerHTML = "";

  if (!dados.insights || dados.insights.length === 0) {
    lista.innerHTML = `
      <div class="insight-item">
        <strong>Situação estável:</strong>
        Nenhum insight disponível no momento.
      </div>
    `;
    return;
  }

  dados.insights.forEach(function (insight) {
    lista.innerHTML += `
      <div class="insight-item">
        <strong>${insight.titulo}:</strong>
        ${insight.descricao}
      </div>
    `;
  });
}

function carregarResumoStatusLojas(dados) {
  const container = document.getElementById("resumoStatusLojas");

  if (!container) {
    return;
  }

  const totalLojas = dados.totalLojas;
  const totalCritico = dados.statusLojas.critico;
  const totalAtencao = dados.statusLojas.atencao;
  const totalNormal = dados.statusLojas.normal;

  if (totalLojas === 0) {
    container.innerHTML = `
      <div class="empty-state">
        Nenhuma loja cadastrada.
      </div>
    `;
    return;
  }

  const percentualCritico = Math.round((totalCritico / totalLojas) * 100);
  const percentualAtencao = Math.round((totalAtencao / totalLojas) * 100);
  const percentualNormal = Math.round((totalNormal / totalLojas) * 100);

  container.innerHTML = `
    <div class="status-total-box">
      <strong>${totalLojas}</strong>
      <span>lojas monitoradas</span>
    </div>

    <div class="status-row">
      <div class="status-row-header">
        <span>Crítico</span>
        <strong>${totalCritico}</strong>
      </div>

      <div class="status-bar-track">
        <div class="status-bar-fill status-critical" style="width: ${percentualCritico}%"></div>
      </div>

      <small>${percentualCritico}% das lojas</small>
    </div>

    <div class="status-row">
      <div class="status-row-header">
        <span>Atenção</span>
        <strong>${totalAtencao}</strong>
      </div>

      <div class="status-bar-track">
        <div class="status-bar-fill status-warning" style="width: ${percentualAtencao}%"></div>
      </div>

      <small>${percentualAtencao}% das lojas</small>
    </div>

    <div class="status-row">
      <div class="status-row-header">
        <span>Normal</span>
        <strong>${totalNormal}</strong>
      </div>

      <div class="status-bar-track">
        <div class="status-bar-fill status-normal" style="width: ${percentualNormal}%"></div>
      </div>

      <small>${percentualNormal}% das lojas</small>
    </div>
  `;
}

function carregarHistoricoEnvios(dados) {
  const metricasEl = document.getElementById("metricasEnvios");
  const historicoEl = document.getElementById("historicoEnvios");

  if (!metricasEl || !historicoEl) {
    return;
  }

  const historico = dados.historicoEnvios || [];

  if (historico.length === 0) {
    metricasEl.innerHTML = `
      <div class="metrica-card">
        <div class="metrica-label">Envios este mês</div>
        <div class="metrica-valor">0</div>
        <div class="metrica-tendencia tendencia-flat">
          <span>→</span> nenhum envio registrado
        </div>
      </div>
    `;

    historicoEl.innerHTML = `
      <div class="empty-state">
        Nenhum histórico de envio encontrado.
      </div>
    `;

    return;
  }

  const valores = historico.map(function (item) {
    return item.totalEnviado;
  });

  const maximo = Math.max.apply(null, valores);
  const total = valores.reduce(function (acc, valor) {
    return acc + valor;
  }, 0);

  const media = Math.round(total / valores.length);
  const melhorItem = historico[valores.indexOf(maximo)];
  const ultimo = valores[valores.length - 1];
  const penultimo = valores[valores.length - 2] || 0;

  let variacao = 0;

  if (penultimo > 0) {
    variacao = Math.round(((ultimo - penultimo) / penultimo) * 100);
  }

  const sinalVariacao = variacao > 0 ? "up" : variacao < 0 ? "down" : "flat";
  const setaVariacao = variacao > 0 ? "↑" : variacao < 0 ? "↓" : "→";

  metricasEl.innerHTML = `
    <div class="metrica-card">
      <div class="metrica-label">Envios este mês</div>
      <div class="metrica-valor">${ultimo}</div>
      <div class="metrica-tendencia tendencia-${sinalVariacao}">
        <span>${setaVariacao}</span> ${Math.abs(variacao)}% vs mês anterior
      </div>
    </div>

    <div class="metrica-card">
      <div class="metrica-label">Média mensal</div>
      <div class="metrica-valor">${media}</div>
      <div class="metrica-tendencia tendencia-flat">
        <span>→</span> últimos ${historico.length} meses
      </div>
    </div>

    <div class="metrica-card">
      <div class="metrica-label">Melhor mês</div>
      <div class="metrica-valor">${maximo}</div>
      <div class="metrica-tendencia tendencia-flat">
        <span>→</span> ${melhorItem.mes}
      </div>
    </div>

    <div class="metrica-card">
      <div class="metrica-label">Total no período</div>
      <div class="metrica-valor">${total.toLocaleString("pt-BR")}</div>
      <div class="metrica-tendencia tendencia-flat">
        <span>→</span> últimos 6 meses
      </div>
    </div>
  `;

  historicoEl.innerHTML = historico
    .map(function (item) {
      const largura =
        maximo > 0 ? Math.round((item.totalEnviado / maximo) * 100) : 0;

      return `
        <div class="historico-linha">
          <span class="historico-mes">${item.mes}</span>
          <div class="historico-barra-wrap">
            <div class="historico-barra" style="width: ${largura}%"></div>
          </div>
          <span class="historico-valor">${item.totalEnviado}</span>
        </div>
      `;
    })
    .join("");
}

function exibirErroDashboard() {
  const lista = document.getElementById("listaInsights");

  if (lista) {
    lista.innerHTML = `
      <div class="insight-item">
        <strong>Erro:</strong>
        Não foi possível carregar os dados do dashboard.
      </div>
    `;
  }
}

async function inicializarDashboard() {
  try {
    const dados = await buscarResumoDashboard();

    carregarCardsDashboard(dados);
    carregarTabelaLojasCriticas(dados);
    carregarInsights(dados);
    carregarHistoricoEnvios(dados);
    carregarResumoStatusLojas(dados);
  } catch (erro) {
    console.error(erro);
    exibirErroDashboard();
  }
}

document.addEventListener("DOMContentLoaded", inicializarDashboard);
