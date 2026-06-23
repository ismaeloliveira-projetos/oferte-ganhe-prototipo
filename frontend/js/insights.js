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

carregarUsuarioLogado();
carregarInsights();
carregarLojasCriticas();
carregarResumoOperacional();
aplicarPermissoesMenu();
