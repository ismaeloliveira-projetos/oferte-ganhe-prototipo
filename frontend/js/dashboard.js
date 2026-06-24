function buscarLojasSalvas() {
  const banco = carregarBanco();
  if (!banco.lojas) {
    banco.lojas = [];
    salvarBanco(banco);
  }
  return filtrarPorLoja(banco.lojas, buscarUsuarioLogado(), "codigo");
}

function buscarEnviosSalvos() {
  const banco = carregarBanco();
  if (!banco.envios) {
    banco.envios = [];
    salvarBanco(banco);
  }
  return filtrarPorLoja(banco.envios, buscarUsuarioLogado(), "codigoLoja");
}

function buscarRecebimentosSalvos() {
  const banco = carregarBanco();
  if (!banco.recebimentos) {
    banco.recebimentos = [];
    salvarBanco(banco);
  }
  return filtrarPorLoja(
    banco.recebimentos,
    buscarUsuarioLogado(),
    "codigoLoja",
  );
}

function buscarManutencoesSalvas() {
  const banco = carregarBanco();
  if (!banco.manutencoes) {
    banco.manutencoes = [];
    salvarBanco(banco);
  }
  return filtrarPorLoja(banco.manutencoes, buscarUsuarioLogado(), "codigoLoja");
}

function obterEstoqueAtual(loja) {
  return Number(
    loja.estoqueAtual ??
      loja.quantidadeAtual ??
      loja.recomendado ??
      loja.estoqueRecomendado ??
      0,
  );
}

function obterEstoqueMinimo(loja) {
  return Number(loja.estoqueMinimo ?? loja.minimo ?? 0);
}

function obterEstoqueRecomendado(loja) {
  return Number(loja.estoqueRecomendado ?? loja.recomendado ?? 0);
}

function obterStatusEstoque(loja) {
  const estoqueAtual = obterEstoqueAtual(loja);
  const estoqueMinimo = obterEstoqueMinimo(loja);
  const estoqueRecomendado = obterEstoqueRecomendado(loja);

  if (estoqueAtual <= estoqueMinimo) {
    return "Crítico";
  }

  if (estoqueAtual < estoqueRecomendado) {
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

function envioEhDoMesAtual(envio) {
  const dataEnvio = new Date(envio.dataHora);

  if (isNaN(dataEnvio.getTime())) {
    return false;
  }

  const hoje = new Date();

  return (
    dataEnvio.getMonth() === hoje.getMonth() &&
    dataEnvio.getFullYear() === hoje.getFullYear()
  );
}

function obterQuantidadeEnvio(envio) {
  return Number(
    envio.quantidade ??
      envio.quantidadeEnviada ??
      envio.quantidade_enviada ??
      0,
  );
}

function carregarCardsDashboard() {
  const lojas = buscarLojasSalvas();
  const envios = buscarEnviosSalvos();

  const totalLojas = lojas.length;

  const totalEstoque = lojas.reduce(function (total, loja) {
    return total + obterEstoqueAtual(loja);
  }, 0);

  const lojasCriticas = lojas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Crítico";
  }).length;

  const enviosMes = envios.filter(function (envio) {
    return envioEhDoMesAtual(envio);
  }).length;

  document.getElementById("totalLojas").textContent = totalLojas;
  document.getElementById("totalEstoque").textContent = totalEstoque;
  document.getElementById("lojasCriticas").textContent = lojasCriticas;
  document.getElementById("enviosMes").textContent = enviosMes;
}

function carregarTabelaLojasCriticas() {
  const tabela = document.getElementById("tabelaLojasCriticas");

  if (!tabela) {
    return;
  }

  const lojas = buscarLojasSalvas();

  const lojasComAtencao = lojas.filter(function (loja) {
    const status = obterStatusEstoque(loja);

    return status === "Crítico" || status === "Atenção";
  });

  tabela.innerHTML = "";

  if (lojasComAtencao.length === 0) {
    tabela.innerHTML = `
            <tr>
                <td colspan="6">Nenhuma loja em situação crítica ou de atenção.</td>
            </tr>
        `;
    return;
  }

  lojasComAtencao.forEach(function (loja) {
    const status = obterStatusEstoque(loja);
    const classeStatus = obterClasseStatus(status);

    tabela.innerHTML += `
            <tr>
                <td>${loja.codigo || "-"}</td>
                <td>${loja.nome || "Loja sem nome"}</td>
                <td>${obterEstoqueAtual(loja)}</td>
                <td>${obterEstoqueMinimo(loja)}</td>
                <td>${obterEstoqueRecomendado(loja)}</td>
                <td>
                    <span class="badge-status ${classeStatus}">
                        ${status}
                    </span>
                </td>
            </tr>
        `;
  });

  aplicarResponsividadeTabelas();
}

function carregarInsights() {
  const lista = document.getElementById("listaInsights");

  if (!lista) {
    return;
  }

  const lojas = buscarLojasSalvas();
  const envios = buscarEnviosSalvos();
  const recebimentos = buscarRecebimentosSalvos();
  const manutencoes = buscarManutencoesSalvas();

  const lojasCriticas = lojas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Crítico";
  });

  const lojasAtencao = lojas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Atenção";
  });

  const enviosPendentes = envios.filter(function (envio) {
    return envio.status === "Pendente";
  });

  const totalEnviado = envios.reduce(function (total, envio) {
    return total + obterQuantidadeEnvio(envio);
  }, 0);

  lista.innerHTML = "";

  if (lojasCriticas.length > 0) {
    lista.innerHTML += `
            <div class="insight-item">
                <strong>Estoque crítico:</strong>
                Existem ${lojasCriticas.length} loja(s) abaixo do estoque mínimo.
            </div>
        `;
  }

  if (lojasAtencao.length > 0) {
    lista.innerHTML += `
            <div class="insight-item">
                <strong>Atenção:</strong>
                Existem ${lojasAtencao.length} loja(s) abaixo do estoque recomendado.
            </div>
        `;
  }

  if (enviosPendentes.length > 0) {
    lista.innerHTML += `
            <div class="insight-item">
                <strong>Envios pendentes:</strong>
                Existem ${enviosPendentes.length} remessa(s) aguardando recebimento.
            </div>
        `;
  }

  lista.innerHTML += `
        <div class="insight-item">
            <strong>Movimentação:</strong>
            O sistema possui ${envios.length} envio(s), ${recebimentos.length} recebimento(s) e ${manutencoes.length} manutenção(ões).
        </div>
    `;

  lista.innerHTML += `
        <div class="insight-item">
            <strong>Total enviado:</strong>
            Foram registrados ${totalEnviado} talões enviados no sistema.
        </div>
    `;

  if (
    lojasCriticas.length === 0 &&
    lojasAtencao.length === 0 &&
    enviosPendentes.length === 0
  ) {
    lista.innerHTML += `
            <div class="insight-item">
                <strong>Situação estável:</strong>
                Nenhuma pendência crítica identificada no momento.
            </div>
        `;
  }
}

function carregarGraficoEstoque() {
  const canvas = document.getElementById("graficoEstoque");
  if (!canvas) return;

  const lojas = buscarLojasSalvas();

  const nomes = lojas.map(function (loja) {
    return loja.nome;
  });
  const atuais = lojas.map(function (loja) {
    return obterEstoqueAtual(loja);
  });
  const minimos = lojas.map(function (loja) {
    return obterEstoqueMinimo(loja);
  });

  const isDark = matchMedia("(prefers-color-scheme: dark)").matches;
  const textColor = isDark ? "#aaa" : "#888";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: nomes,
      datasets: [
        {
          label: "Estoque atual",
          data: atuais,
          backgroundColor: "#378ADD",
          borderRadius: 4,
          barPercentage: 0.5,
        },
        {
          label: "Mínimo",
          data: minimos,
          backgroundColor: "rgba(226,75,74,0.4)",
          borderRadius: 4,
          barPercentage: 0.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } },
      },
    },
  });
}

function carregarHistoricoEnvios() {
  const metricasEl = document.getElementById("metricasEnvios");
  const historicoEl = document.getElementById("historicoEnvios");

  if (!metricasEl || !historicoEl) return;

  const banco = carregarBanco();
  const historico = banco.historicoEnvios || [];

  if (historico.length === 0) return;

  const valores = historico.map(function (item) {
    return item.totalEnviado;
  });
  const maximo = Math.max.apply(null, valores);
  const total = valores.reduce(function (acc, v) {
    return acc + v;
  }, 0);
  const media = Math.round(total / valores.length);
  const melhorItem = historico[valores.indexOf(maximo)];
  const ultimo = valores[valores.length - 1];
  const penultimo = valores[valores.length - 2];
  const variacao = Math.round(((ultimo - penultimo) / penultimo) * 100);
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
        <span>→</span> ${melhorItem.mes}/${melhorItem.ano}
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
      var largura = Math.round((item.totalEnviado / maximo) * 100);
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

function carregarResumoStatusLojas() {
  const container = document.getElementById("resumoStatusLojas");

  if (!container) {
    return;
  }

  const lojas = buscarLojasSalvas();

  const totalLojas = lojas.length;

  const totalCritico = lojas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Crítico";
  }).length;

  const totalAtencao = lojas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Atenção";
  }).length;

  const totalNormal = lojas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Normal";
  }).length;

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

document.addEventListener("DOMContentLoaded", function () {
  carregarCardsDashboard();
  carregarTabelaLojasCriticas();
  carregarInsights();
  carregarHistoricoEnvios();
  carregarResumoStatusLojas();
});
