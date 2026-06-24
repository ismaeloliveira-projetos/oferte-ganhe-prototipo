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

function buscarInsights() {
  const banco = carregarBanco();
  return banco.insights || [];
}

function obterStatusEstoque(loja) {
  if (loja.estoqueAtual <= loja.estoqueMinimo) return "Crítico";
  if (loja.estoqueAtual < loja.estoqueRecomendado) return "Atenção";
  return "Normal";
}

function obterClasseStatusEstoque(status) {
  if (status === "Crítico") return "badge-critico";
  if (status === "Atenção") return "badge-atencao";
  return "badge-normal";
}

function carregarInsights() {
  const container = document.getElementById("insightsContainer");
  const insights = buscarInsights();

  if (insights.length === 0) {
    container.innerHTML = "<p>Nenhum insight disponível no momento.</p>";
    return;
  }

  container.innerHTML = "";
  insights.forEach((insight, index) => {
    container.innerHTML += `
      <div class="insight-item">
        <p>${insight}</p>
      </div>
    `;
  });
}

function carregarLojasCriticas() {
  const tabela = document.getElementById("tabelaLojasCriticas");
  const lojas = buscarLojasSalvas();
  const lojasCriticas = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Crítico",
  );

  tabela.innerHTML = "";

  if (lojasCriticas.length === 0) {
    tabela.innerHTML =
      "<tr><td colspan='5'>Nenhuma loja em situação crítica</td></tr>";
    return;
  }

  lojasCriticas.forEach((loja) => {
    const status = obterStatusEstoque(loja);
    const classe = obterClasseStatusEstoque(status);

    tabela.innerHTML += `
      <tr>
        <td>${loja.codigo}</td>
        <td>${loja.nome}</td>
        <td>${loja.estoqueAtual}</td>
        <td>${loja.estoqueMinimo}</td>
        <td><span class="badge ${classe}">${status}</span></td>
      </tr>
    `;
  });

  aplicarResponsividadeTabelas();
}

function carregarResumoOperacional() {
  const lojas = buscarLojasSalvas();
  const envios = buscarEnviosSalvos();
  const recebimentos = buscarRecebimentosSalvos();

  const totalTaloes = lojas.reduce(
    (total, loja) => total + (loja.estoqueAtual || 0),
    0,
  );
  const lojasNormais = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Normal",
  ).length;
  const lojasAtencao = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Atenção",
  ).length;
  const lojasCriticas = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Crítico",
  ).length;

  document.getElementById("totalTaloesEstoque").textContent = totalTaloes;
  document.getElementById("lojasNormaisInsights").textContent = lojasNormais;
  document.getElementById("lojasAtencaoInsights").textContent = lojasAtencao;
  document.getElementById("lojasCriticasInsights").textContent = lojasCriticas;
  document.getElementById("totalEnviosInsights").textContent = envios.length;
  document.getElementById("totalRecebimentosInsights").textContent =
    recebimentos.length;
}

function obterEstoqueAtualIA(loja) {
  return Number(
    loja.estoqueAtual ?? loja.quantidadeAtual ?? loja.estoqueRecomendado ?? 0,
  );
}

function obterEstoqueMinimoIA(loja) {
  return Number(loja.estoqueMinimo ?? loja.minimo ?? 0);
}

function obterEstoqueRecomendadoIA(loja) {
  return Number(loja.estoqueRecomendado ?? loja.recomendado ?? 0);
}

function obterStatusEstoqueIA(loja) {
  const atual = obterEstoqueAtualIA(loja);
  const minimo = obterEstoqueMinimoIA(loja);
  const recomendado = obterEstoqueRecomendadoIA(loja);

  if (atual <= minimo) {
    return "Crítico";
  }

  if (atual < recomendado) {
    return "Atenção";
  }

  return "Normal";
}

function obterReposicaoSugeridaIA(loja) {
  const atual = obterEstoqueAtualIA(loja);
  const recomendado = obterEstoqueRecomendadoIA(loja);

  const reposicao = recomendado - atual;

  return reposicao > 0 ? reposicao : 0;
}

function buscarDadosInsightsIA() {
  const banco = carregarBanco();

  return {
    lojas: banco.lojas || [],
    envios: banco.envios || [],
    recebimentos: banco.recebimentos || [],
    manutencoes: banco.manutencoes || [],
  };
}

function obterRecebimentosPendentesIA(envios) {
  return envios.filter(function (envio) {
    const status = String(envio.status || "").toLowerCase();

    return (
      status !== "recebido" &&
      status !== "concluído" &&
      status !== "concluido" &&
      status !== "finalizado"
    );
  });
}

function gerarAlertasIA() {
  const dados = buscarDadosInsightsIA();

  const lojasCriticas = dados.lojas.filter(function (loja) {
    return obterStatusEstoqueIA(loja) === "Crítico";
  });

  const lojasAtencao = dados.lojas.filter(function (loja) {
    return obterStatusEstoqueIA(loja) === "Atenção";
  });

  const recebimentosPendentes = obterRecebimentosPendentesIA(dados.envios);

  const lojasSemEstoque = dados.lojas.filter(function (loja) {
    return obterEstoqueAtualIA(loja) === 0;
  });

  const alertas = [];

  if (lojasCriticas.length > 0) {
    alertas.push({
      tipo: "danger",
      categoria: "Talões baixos",
      titulo: `${lojasCriticas.length} loja(s) abaixo do estoque mínimo`,
      descricao:
        "A IA identificou lojas em situação crítica. Essas unidades devem ser priorizadas para reposição de talões.",
    });
  }

  if (lojasAtencao.length > 0) {
    alertas.push({
      tipo: "warning",
      categoria: "Estoque em atenção",
      titulo: `${lojasAtencao.length} loja(s) abaixo do estoque recomendado`,
      descricao:
        "Essas lojas ainda não estão críticas, mas já indicam necessidade de acompanhamento preventivo.",
    });
  }

  if (recebimentosPendentes.length > 0) {
    alertas.push({
      tipo: "warning",
      categoria: "Recebimentos pendentes",
      titulo: `${recebimentosPendentes.length} envio(s) aguardando confirmação`,
      descricao:
        "Existem remessas enviadas que ainda não foram confirmadas como recebidas pelas lojas.",
    });
  }

  if (lojasSemEstoque.length > 0) {
    alertas.push({
      tipo: "danger",
      categoria: "Anomalia operacional",
      titulo: `${lojasSemEstoque.length} loja(s) com estoque zerado`,
      descricao:
        "A IA classificou estoque zerado como uma anomalia que pode impactar a distribuição de talões.",
    });
  }

  if (lojasCriticas.length + lojasAtencao.length > 0) {
    alertas.push({
      tipo: "info",
      categoria: "Solicitações sugeridas",
      titulo: `${lojasCriticas.length + lojasAtencao.length} solicitação(ões) de reposição sugerida(s)`,
      descricao:
        "Com base no estoque mínimo e recomendado, a IA sugere gerar solicitações de reposição para essas lojas.",
    });
  }

  if (alertas.length === 0) {
    alertas.push({
      tipo: "info",
      categoria: "Operação estável",
      titulo: "Nenhuma anomalia relevante identificada",
      descricao:
        "A IA não encontrou lojas críticas, pendências ou comportamentos fora do esperado neste momento.",
    });
  }

  return {
    alertas,
    lojasCriticas,
    lojasAtencao,
    recebimentosPendentes,
    lojasSemEstoque,
    dados,
  };
}

function carregarResumoIA() {
  const resultado = gerarAlertasIA();

  const resumoEl = document.getElementById("resumoIA");
  const totalAlertasEl = document.getElementById("totalAlertasIA");
  const pendentesEl = document.getElementById("recebimentosPendentesInsights");

  const totalEstoque = resultado.dados.lojas.reduce(function (total, loja) {
    return total + obterEstoqueAtualIA(loja);
  }, 0);

  const lojasNormais = resultado.dados.lojas.filter(function (loja) {
    return obterStatusEstoqueIA(loja) === "Normal";
  });

  if (document.getElementById("totalTaloesEstoque")) {
    document.getElementById("totalTaloesEstoque").textContent = totalEstoque;
  }

  if (document.getElementById("lojasCriticasInsights")) {
    document.getElementById("lojasCriticasInsights").textContent =
      resultado.lojasCriticas.length;
  }

  if (document.getElementById("lojasAtencaoInsights")) {
    document.getElementById("lojasAtencaoInsights").textContent =
      resultado.lojasAtencao.length;
  }

  if (document.getElementById("lojasNormaisInsights")) {
    document.getElementById("lojasNormaisInsights").textContent =
      lojasNormais.length;
  }

  if (document.getElementById("totalEnviosInsights")) {
    document.getElementById("totalEnviosInsights").textContent =
      resultado.dados.envios.length;
  }

  if (document.getElementById("totalRecebimentosInsights")) {
    document.getElementById("totalRecebimentosInsights").textContent =
      resultado.dados.recebimentos.length;
  }

  if (totalAlertasEl) {
    totalAlertasEl.textContent = resultado.alertas.length;
  }

  if (pendentesEl) {
    pendentesEl.textContent = resultado.recebimentosPendentes.length;
  }

  if (resumoEl) {
    resumoEl.innerHTML = `
      <strong>A IA analisou ${resultado.dados.lojas.length} loja(s), ${resultado.dados.envios.length} envio(s) e ${resultado.dados.recebimentos.length} recebimento(s).</strong>
      <p>
        Foram identificados ${resultado.alertas.length} ponto(s) de atenção na operação,
        considerando estoque baixo, recebimentos pendentes, anomalias e necessidade de reposição.
      </p>
    `;
  }

  document.getElementById("monitorAnomalias").textContent =
    resultado.lojasSemEstoque.length;

  document.getElementById("monitorEstoqueBaixo").textContent =
    resultado.lojasCriticas.length;

  document.getElementById("monitorPendencias").textContent =
    resultado.recebimentosPendentes.length;

  document.getElementById("monitorSolicitacoes").textContent =
    resultado.lojasCriticas.length + resultado.lojasAtencao.length;
}

function carregarPrioridadeIA() {
  const resultado = gerarAlertasIA();

  const prioridadeEl = document.getElementById("prioridadeIA");

  if (!prioridadeEl) return;

  const lojasPrioritarias = resultado.lojasCriticas
    .map(function (loja) {
      return {
        codigo: loja.codigo,
        nome: loja.nome,
        reposicao: obterReposicaoSugeridaIA(loja),
      };
    })
    .sort(function (a, b) {
      return b.reposicao - a.reposicao;
    })
    .slice(0, 3);

  if (lojasPrioritarias.length === 0) {
    prioridadeEl.innerHTML = `
      <div class="ia-empty-state">
        Nenhuma loja crítica no momento.
      </div>
    `;
    return;
  }

  prioridadeEl.innerHTML = lojasPrioritarias
    .map(function (loja) {
      return `
        <div class="ia-priority-item">
          <div class="ia-priority-info">
            <strong>${loja.codigo} - ${loja.nome}</strong>
            <span>Reposição sugerida de ${loja.reposicao} talões</span>
          </div>

          <span class="ia-priority-badge">Prioridade</span>
        </div>
      `;
    })
    .join("");
}

function carregarAlertasIA() {
  const resultado = gerarAlertasIA();

  const alertasEl = document.getElementById("alertasIA");

  if (!alertasEl) return;

  alertasEl.innerHTML = resultado.alertas
    .map(function (alerta) {
      return `
        <div class="ia-alert-item ${alerta.tipo}">
          <span class="ia-alert-meta">${alerta.categoria}</span>
          <strong>${alerta.titulo}</strong>
          <p>${alerta.descricao}</p>
        </div>
      `;
    })
    .join("");
}

function carregarTabelaLojasCriticasIA() {
  const resultado = gerarAlertasIA();

  const tabela = document.getElementById("tabelaLojasCriticas");

  if (!tabela) return;

  if (resultado.lojasCriticas.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6">Nenhuma loja crítica encontrada.</td>
      </tr>
    `;
    return;
  }

  tabela.innerHTML = resultado.lojasCriticas
    .map(function (loja) {
      return `
        <tr>
          <td>${loja.codigo}</td>
          <td>${loja.nome}</td>
          <td>${obterEstoqueAtualIA(loja)}</td>
          <td>${obterEstoqueMinimoIA(loja)}</td>
          <td>${obterReposicaoSugeridaIA(loja)}</td>
          <td><span class="badge badge-critico">Crítico</span></td>
        </tr>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", function () {
  carregarResumoIA();
  carregarPrioridadeIA();
  carregarAlertasIA();
  carregarTabelaLojasCriticasIA();
  carregarResumoOperacional();
  aplicarPermissoesMenu();
});
