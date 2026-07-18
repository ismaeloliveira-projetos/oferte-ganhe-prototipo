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
  return await apiFetch("/api/dashboard/resumo");
}

function normalizarNumero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
}

function calcularStatusEstoque(
  estoqueAtual,
  estoqueMinimo,
  estoqueRecomendado,
) {
  if (estoqueAtual <= estoqueMinimo) {
    return "Crítico";
  }

  if (estoqueAtual < estoqueRecomendado) {
    return "Atenção";
  }

  return "Normal";
}

function normalizarLojaDashboard(loja) {
  const estoqueAtual = normalizarNumero(
    loja.estoqueAtual ??
      loja.estoque_atual ??
      loja.quantidadeAtual ??
      loja.quantidade_atual ??
      loja.saldoAtual,
  );

  const estoqueMinimo = normalizarNumero(
    loja.estoqueMinimo ??
      loja.estoque_minimo ??
      loja.quantidadeMinima ??
      loja.quantidade_minima ??
      loja.minimo,
  );

  const estoqueRecomendado = normalizarNumero(
    loja.estoqueRecomendado ??
      loja.estoque_recomendado ??
      loja.quantidadeRecomendada ??
      loja.quantidade_recomendada ??
      loja.recomendado,
  );

  const statusEstoque =
    loja.statusEstoque ??
    loja.status_estoque ??
    loja.status ??
    calcularStatusEstoque(estoqueAtual, estoqueMinimo, estoqueRecomendado);

  return {
    lojaId:
      loja.lojaId ?? loja.loja_id ?? loja.idLoja ?? loja.id_loja ?? loja.id,

    codigoLoja:
      loja.codigoLoja ??
      loja.codigo_loja ??
      loja.codigo ??
      loja.lojaCodigo ??
      loja.loja_codigo ??
      "-",

    nomeLoja:
      loja.nomeLoja ??
      loja.nome_loja ??
      loja.nome ??
      loja.lojaNome ??
      loja.loja_nome ??
      "Loja sem nome",

    estoqueAtual,
    estoqueMinimo,
    estoqueRecomendado,
    statusEstoque,
  };
}

function normalizarHistoricoEnvio(item) {
  return {
    mes: item.mes ?? item.periodo ?? item.mesAno ?? item.mes_ano ?? "-",

    totalEnviado: normalizarNumero(
      item.totalEnviado ?? item.total_enviado ?? item.quantidade ?? item.total,
    ),
  };
}

function normalizarInsight(insight) {
  if (typeof insight === "string") {
    return {
      titulo: "Insight",
      descricao: insight,
    };
  }

  return {
    titulo: insight.titulo ?? insight.title ?? "Insight",
    descricao: insight.descricao ?? insight.description ?? "",
  };
}

function normalizarDashboard(dados, estoquesCompletos = []) {
  const statusLojasOriginal = dados.statusLojas ?? dados.status_lojas ?? {};

  const lojasAtencaoOriginais =
    dados.lojasAtencao ??
    dados.lojas_atencao ??
    dados.lojasComAtencao ??
    dados.lojas_com_atencao ??
    dados.lojasCriticasLista ??
    dados.lojas_criticas_lista ??
    [];

  const lojasAtencao = Array.isArray(lojasAtencaoOriginais)
    ? lojasAtencaoOriginais.map(normalizarLojaDashboard)
    : [];

  const estoquesNormalizados = Array.isArray(estoquesCompletos)
    ? estoquesCompletos.map(normalizarLojaDashboard)
    : [];

  const historicoEnviosOriginais =
    dados.historicoEnvios ?? dados.historico_envios ?? [];

  const historicoEnvios = Array.isArray(historicoEnviosOriginais)
    ? historicoEnviosOriginais.map(normalizarHistoricoEnvio)
    : [];

  const totalCritico = normalizarNumero(
    statusLojasOriginal.critico ??
      statusLojasOriginal.crítico ??
      statusLojasOriginal.criticos ??
      dados.lojasCriticas ??
      dados.lojas_criticas ??
      lojasAtencao.filter(function (loja) {
        return loja.statusEstoque === "Crítico";
      }).length,
  );

  const totalAtencao = normalizarNumero(
    statusLojasOriginal.atencao ??
      statusLojasOriginal.atenção ??
      statusLojasOriginal.atencoes ??
      dados.lojasAtencaoTotal ??
      dados.lojas_atencao_total ??
      lojasAtencao.filter(function (loja) {
        return loja.statusEstoque === "Atenção";
      }).length,
  );

  const totalNormal = normalizarNumero(statusLojasOriginal.normal);

  const totalLojasPorStatus = totalCritico + totalAtencao + totalNormal;

  const totalLojas =
    dados.totalLojas !== null && dados.totalLojas !== undefined
      ? normalizarNumero(dados.totalLojas)
      : dados.total_lojas !== null && dados.total_lojas !== undefined
        ? normalizarNumero(dados.total_lojas)
        : totalLojasPorStatus > 0
          ? totalLojasPorStatus
          : estoquesNormalizados.length;

  const totalEstoqueCalculado = estoquesNormalizados.reduce(function (
    total,
    estoque,
  ) {
    return total + normalizarNumero(estoque.estoqueAtual);
  }, 0);

  const totalEstoqueFallback = lojasAtencao.reduce(function (total, loja) {
    return total + normalizarNumero(loja.estoqueAtual);
  }, 0);

  const totalEstoque =
    dados.totalEstoque !== null && dados.totalEstoque !== undefined
      ? normalizarNumero(dados.totalEstoque)
      : dados.total_estoque !== null && dados.total_estoque !== undefined
        ? normalizarNumero(dados.total_estoque)
        : totalEstoqueCalculado > 0
          ? totalEstoqueCalculado
          : totalEstoqueFallback;

  const ultimoHistorico = historicoEnvios[historicoEnvios.length - 1];

  const enviosMes =
    dados.enviosMes !== null && dados.enviosMes !== undefined
      ? normalizarNumero(dados.enviosMes)
      : dados.envios_mes !== null && dados.envios_mes !== undefined
        ? normalizarNumero(dados.envios_mes)
        : dados.totalEnviosMes !== null && dados.totalEnviosMes !== undefined
          ? normalizarNumero(dados.totalEnviosMes)
          : dados.total_envios_mes !== null &&
              dados.total_envios_mes !== undefined
            ? normalizarNumero(dados.total_envios_mes)
            : normalizarNumero(ultimoHistorico?.totalEnviado);

  const insights = Array.isArray(dados.insights)
    ? dados.insights.map(normalizarInsight)
    : [];

  return {
    totalLojas,
    totalEstoque,
    lojasCriticas: totalCritico,
    enviosMes,
    lojasAtencao,
    insights,
    statusLojas: {
      critico: totalCritico,
      atencao: totalAtencao,
      normal: totalNormal,
    },
    historicoEnvios,
  };
}

function preencherTexto(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor;
  }
}

function carregarCardsDashboard(dados) {
  preencherTexto("totalLojas", dados.totalLojas);
  preencherTexto("totalEstoque", dados.totalEstoque);
  preencherTexto("lojasCriticas", dados.lojasCriticas);
  preencherTexto("enviosMes", dados.enviosMes);
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
        <td>${loja.codigoLoja}</td>
        <td>${loja.nomeLoja}</td>
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

  const totalLojas = normalizarNumero(dados.totalLojas);
  const totalCritico = normalizarNumero(dados.statusLojas.critico);
  const totalAtencao = normalizarNumero(dados.statusLojas.atencao);
  const totalNormal = normalizarNumero(dados.statusLojas.normal);

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
    return normalizarNumero(item.totalEnviado);
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
      const totalEnviado = normalizarNumero(item.totalEnviado);
      const largura =
        maximo > 0 ? Math.round((totalEnviado / maximo) * 100) : 0;

      return `
        <div class="historico-linha">
          <span class="historico-mes">${item.mes}</span>
          <div class="historico-barra-wrap">
            <div class="historico-barra" style="width: ${largura}%"></div>
          </div>
          <span class="historico-valor">${totalEnviado}</span>
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
  const usuario = carregarUsuarioLogado();

  if (!usuario) {
    return;
  }

  try {
    const resposta = await buscarResumoDashboard();

    let estoquesCompletos = [];

    try {
      estoquesCompletos = await apiFetch("/api/estoques");
    } catch (erroEstoque) {
      console.warn("Não foi possível buscar estoques completos:", erroEstoque);
    }

    const dados = normalizarDashboard(resposta, estoquesCompletos);

    console.log("DASHBOARD API:", resposta);
    console.log("ESTOQUES DASHBOARD:", estoquesCompletos);
    console.log("DASHBOARD NORMALIZADO:", dados);

    carregarCardsDashboard(dados);
    carregarTabelaLojasCriticas(dados);
    carregarHistoricoEnvios(dados);
    carregarResumoStatusLojas(dados);

    configurarEventosDashboardIA();
    await carregarPainelInsightsIA();

    if (typeof aplicarPermissoesMenu === "function") {
      aplicarPermissoesMenu();
    }
  } catch (erro) {
    console.error("Erro ao carregar dashboard:", erro);
    exibirErroDashboard();
  }
}

async function buscarIndicadorRiscoEstoqueIA() {
  return await apiFetch("/api/ia/indicadores/estoque/risco");
}

async function gerarInsightRiscoEstoqueIA() {
  return await apiFetch("/api/ia/insights/estoque/risco");
}

function traduzirStatusRiscoIA(status) {
  const mapa = {
    SEM_ESTOQUE_CADASTRADO: "sem estoque cadastrado",
    CRITICO: "crítica",
    ATENCAO: "em atenção",
    OK: "normal",
  };

  return mapa[status] || status || "-";
}

function obterResumoStatusIA(indicador, status) {
  return normalizarNumero(indicador?.resumo_por_status?.[status]);
}

function obterLojasIndicadorIA(indicador) {
  if (!indicador || !Array.isArray(indicador.dados)) {
    return [];
  }

  return indicador.dados;
}

function ordenarLojasPrioridadeIA(lojas) {
  const pesoStatus = {
    SEM_ESTOQUE_CADASTRADO: 1,
    CRITICO: 2,
    ATENCAO: 3,
    OK: 4,
  };

  return [...lojas].sort(function (a, b) {
    const pesoA = pesoStatus[a.status_risco] || 99;
    const pesoB = pesoStatus[b.status_risco] || 99;

    if (pesoA !== pesoB) {
      return pesoA - pesoB;
    }

    return (
      normalizarNumero(b.gap_recomendado) - normalizarNumero(a.gap_recomendado)
    );
  });
}

function escaparHtmlDashboardIA(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarTextoDashboardIA(texto) {
  const textoSeguro = escaparHtmlDashboardIA(texto);

  return textoSeguro
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*\*/g, "")
    .replace(/\n/g, "<br>");
}

function renderizarIndicadorIA(indicador) {
  const lista = document.getElementById("listaInsights");

  if (!lista) {
    return;
  }

  const total = normalizarNumero(indicador.total_lojas_analisadas);
  const criticas = obterResumoStatusIA(indicador, "CRITICO");
  const atencao = obterResumoStatusIA(indicador, "ATENCAO");
  const ok = obterResumoStatusIA(indicador, "OK");
  const semEstoque = obterResumoStatusIA(indicador, "SEM_ESTOQUE_CADASTRADO");

  const lojasPrioritarias = ordenarLojasPrioridadeIA(
    obterLojasIndicadorIA(indicador),
  )
    .filter(function (loja) {
      return (
        loja.status_risco === "SEM_ESTOQUE_CADASTRADO" ||
        loja.status_risco === "CRITICO" ||
        loja.status_risco === "ATENCAO"
      );
    })
    .slice(0, 3);

  let html = `
    <div class="insight-item">
      <strong>Resumo IA:</strong>
      A camada de IA analisou ${total} loja(s) dentro do seu escopo.
      Foram encontradas ${criticas} crítica(s), ${atencao} em atenção,
      ${ok} normal(is) e ${semEstoque} sem estoque cadastrado.
    </div>
  `;

  if (lojasPrioritarias.length > 0) {
    html += `
      <div class="insight-item">
        <strong>Prioridades:</strong>
        <ul>
          ${lojasPrioritarias
            .map(function (loja) {
              return `
                <li>
                  ${escaparHtmlDashboardIA(loja.codigo_loja)} -
                  ${escaparHtmlDashboardIA(loja.nome_loja)}:
                  ${traduzirStatusRiscoIA(loja.status_risco)}.
                  Falta para recomendado:
                  ${normalizarNumero(loja.gap_recomendado)} talões.
                </li>
              `;
            })
            .join("")}
        </ul>
      </div>
    `;
  } else {
    html += `
      <div class="insight-item">
        <strong>Situação estável:</strong>
        Nenhuma loja crítica ou em atenção dentro do seu escopo.
      </div>
    `;
  }

  lista.innerHTML = html;
}

function renderizarInsightGeradoDashboardIA(resultado) {
  const lista = document.getElementById("listaInsights");

  if (!lista) {
    return;
  }

  lista.innerHTML = `
    <div class="insight-item">
      <strong>Insight gerado pela IA:</strong>
      <div>${formatarTextoDashboardIA(resultado.insight)}</div>
    </div>

    <div class="insight-item">
      <strong>Auditoria:</strong>
      Modelo ${escaparHtmlDashboardIA(resultado.modelo)} |
      Tokens ${normalizarNumero(resultado?.usage?.total_tokens)} |
      Custo estimado ${resultado?.usage?.cost ?? 0} |
      Tempo ${normalizarNumero(resultado.tempo_ms)} ms
    </div>
  `;
}

async function carregarPainelInsightsIA() {
  const lista = document.getElementById("listaInsights");

  if (lista) {
    lista.innerHTML = `
      <div class="insight-item">
        <strong>Carregando IA:</strong>
        Consultando indicador de risco de estoque.
      </div>
    `;
  }

  try {
    const indicador = await buscarIndicadorRiscoEstoqueIA();

    console.log("INDICADOR IA DASHBOARD:", indicador);

    renderizarIndicadorIA(indicador);
  } catch (erro) {
    console.error("Erro ao carregar indicador da IA:", erro);

    if (lista) {
      lista.innerHTML = `
        <div class="insight-item">
          <strong>Erro na IA:</strong>
          Não foi possível carregar o indicador inteligente.
        </div>
      `;
    }
  }
}

async function aoClicarGerarInsightDashboardIA() {
  const botao = document.getElementById("btnGerarInsightDashboard");
  const lista = document.getElementById("listaInsights");

  if (!botao) {
    return;
  }

  try {
    botao.disabled = true;
    botao.textContent = "Gerando insight...";

    if (lista) {
      lista.innerHTML = `
        <div class="insight-item">
          <strong>Gerando insight:</strong>
          A IA está calculando o indicador, buscando o prompt versionado e chamando a LLM.
        </div>
      `;
    }

    const resultado = await gerarInsightRiscoEstoqueIA();

    console.log("INSIGHT IA DASHBOARD:", resultado);

    renderizarInsightGeradoDashboardIA(resultado);
  } catch (erro) {
    console.error("Erro ao gerar insight da IA:", erro);

    if (lista) {
      lista.innerHTML = `
        <div class="insight-item">
          <strong>Erro:</strong>
          ${escaparHtmlDashboardIA(
            erro.message || "Não foi possível gerar o insight com IA.",
          )}
        </div>
      `;
    }
  } finally {
    botao.disabled = false;
    botao.textContent = "Gerar insight com IA";
  }
}

function configurarEventosDashboardIA() {
  const botao = document.getElementById("btnGerarInsightDashboard");

  if (botao) {
    botao.addEventListener("click", aoClicarGerarInsightDashboardIA);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  inicializarDashboard();
});
