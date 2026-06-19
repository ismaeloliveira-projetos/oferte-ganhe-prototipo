function buscarLojasSalvas() {
  const banco = carregarBanco();
  if (!banco.lojas) {
    banco.lojas = [];
    salvarBanco(banco);
  }
  return filtrarPorLoja(banco.lojas, buscarUsuarioLogado(), "codigo");
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
  if (estoqueAtual <= estoqueMinimo) return "Crítico";
  if (estoqueAtual < estoqueRecomendado) return "Atenção";
  return "Normal";
}

function obterClasseStatusEstoque(status) {
  if (status === "Crítico") return "badge-critico";
  if (status === "Atenção") return "badge-atencao";
  return "badge-normal";
}

function atualizarTexto(ids, valor) {
  ids.forEach(function (id) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  });
}

function carregarCardsEstoque() {
  const lojas = buscarLojasSalvas();
  const totalEstoque = lojas.reduce(
    (total, loja) => total + obterEstoqueAtual(loja),
    0,
  );
  const lojasCriticas = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Crítico",
  ).length;
  const lojasAtencao = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Atenção",
  ).length;
  const lojasNormais = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Normal",
  ).length;

  atualizarTexto(
    ["totalEstoque", "totalTaloesEstoque", "estoqueTotal"],
    totalEstoque,
  );
  atualizarTexto(
    ["lojasCriticas", "totalLojasCriticas", "estoqueCritico"],
    lojasCriticas,
  );
  atualizarTexto(
    ["lojasAtencao", "totalLojasAtencao", "estoqueAtencao"],
    lojasAtencao,
  );
  atualizarTexto(["lojasNormais", "totalLojasNormais"], lojasNormais);
}

function carregarTabelaEstoque() {
  const tabela = document.getElementById("tabelaEstoque");
  if (!tabela) {
    console.error("Elemento tabelaEstoque não encontrado no HTML.");
    return;
  }

  const lojas = buscarLojasSalvas();
  tabela.innerHTML = "";

  lojas.forEach(function (loja) {
    const estoqueAtual = obterEstoqueAtual(loja);
    const estoqueMinimo = obterEstoqueMinimo(loja);
    const estoqueRecomendado = obterEstoqueRecomendado(loja);
    const status = obterStatusEstoque(loja);
    const classeStatus = obterClasseStatusEstoque(status);

    tabela.innerHTML += `
            <tr>
                <td>${loja.codigo || loja.cod_loja || "-"}</td>
                <td>${loja.nome || loja.nome_loja || "Loja sem nome"}</td>
                <td>${estoqueAtual}</td>
                <td>${estoqueMinimo}</td>
                <td>${estoqueRecomendado}</td>
                <td><span class="badge-status ${classeStatus}">${status}</span></td>
            </tr>
        `;
  });

  aplicarResponsividadeTabelas();
}

carregarUsuarioLogado();
carregarCardsEstoque();
carregarTabelaEstoque();
aplicarPermissoesMenu();
