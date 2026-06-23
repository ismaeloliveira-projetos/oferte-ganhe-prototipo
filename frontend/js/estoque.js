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

function obterReposicaoSugerida(loja) {
  const estoqueAtual = obterEstoqueAtual(loja);
  const estoqueRecomendado = obterEstoqueRecomendado(loja);

  if (estoqueAtual >= estoqueRecomendado) {
    return 0;
  }

  return Math.max(0, estoqueRecomendado - estoqueAtual);
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
  const reposicaoSugerida = lojas.reduce(
    (total, loja) => total + obterReposicaoSugerida(loja),
    0,
  );

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
  atualizarTexto(["reposicaoSugerida"], reposicaoSugerida);
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
    const reposicaoSugerida = obterReposicaoSugerida(loja);
    const status = obterStatusEstoque(loja);
    const classeStatus = obterClasseStatusEstoque(status);

    tabela.innerHTML += `
  <tr>
    <td>${loja.codigo || loja.cod_loja || "-"}</td>
    <td>${loja.nome || loja.nome_loja || "Loja sem nome"}</td>
    <td>${estoqueAtual}</td>
    <td>${estoqueMinimo}</td>
    <td>${estoqueRecomendado}</td>
    <td>${reposicaoSugerida}</td>
    <td><span class="badge-status ${classeStatus}">${status}</span></td>
    <td>
      <button
        class="btn-primary btn-solicitar"
        onclick="solicitarTalao('${loja.codigo || loja.cod_loja}', ${reposicaoSugerida}, this)"
        ${reposicaoSugerida === 0 ? "disabled" : ""}
      >
        Solicitar
      </button>
    </td>
  </tr>
`;
  });

  aplicarResponsividadeTabelas();
}

function solicitarTalao(codigoLoja, quantidade, botao) {
  const banco = carregarBanco();

  const solicitacao = {
    id: Date.now(),
    codigoLoja: codigoLoja,
    quantidade: quantidade,
    dataSolicitacao: new Date().toLocaleDateString("pt-BR"),
    status: "Pendente",
  };

  if (!banco.solicitacoes) banco.solicitacoes = [];
  banco.solicitacoes.push(solicitacao);
  salvarBanco(banco);

  mostrarToast(
    `Solicitação de ${quantidade} talões para a loja ${codigoLoja} registrada com sucesso!`,
  );

  botao.disabled = true;
  botao.textContent = "Solicitado";
}

function exibirRanqueamentoPrioridade() {
  const lojas = buscarLojasSalvas();
  const banner = document.getElementById("alertaRanqueamento");
  const mensagem = document.getElementById("mensagemRanqueamento");
  if (!banner || !mensagem) return;

  const criticas = lojas
    .filter((loja) => obterStatusEstoque(loja) === "Crítico")
    .sort((a, b) => obterReposicaoSugerida(b) - obterReposicaoSugerida(a));

  if (criticas.length === 0) {
    banner.classList.add("hidden");
    return;
  }

  const nomes = criticas.map((loja) => loja.nome || loja.codigo).join(", ");
  mensagem.textContent = `Prioridade de envio sugerida: ${nomes}. Lojas com maior necessidade de reposição.`;
  banner.classList.remove("hidden");
}

carregarUsuarioLogado();
carregarCardsEstoque();
carregarTabelaEstoque();
aplicarPermissoesMenu();
exibirRanqueamentoPrioridade();
