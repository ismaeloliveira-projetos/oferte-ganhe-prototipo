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

function buscarRelatoriosExportados() {
  const banco = carregarBanco();
  if (!banco.relatoriosExportados) {
    banco.relatoriosExportados = [];
    salvarBanco(banco);
  }
  return banco.relatoriosExportados;
}

function salvarRelatoriosExportados(relatorios) {
  const banco = carregarBanco();
  banco.relatoriosExportados = relatorios;
  salvarBanco(banco);
}

function mostrarAlerta(mensagem) {
  const alerta = document.getElementById("alertaSistema");
  if (!alerta) return;
  alerta.textContent = mensagem;
  alerta.classList.remove("hidden");
  setTimeout(() => alerta.classList.add("hidden"), 3000);
}

function obterUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("usuarioLogado");
  if (!usuarioSalvo) return { nome: "Administrador" };
  const usuario = JSON.parse(usuarioSalvo);
  return {
    nome:
      usuario.nome || usuario.nomeCompleto || usuario.email || "Administrador",
  };
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "-";
  const data = new Date(dataHora);
  if (isNaN(data.getTime())) return dataHora;
  return data.toLocaleString("pt-BR");
}

function buscarLojaPorCodigo(codigoLoja) {
  const lojas = buscarLojasSalvas();
  return lojas.find((loja) => String(loja.codigo) === String(codigoLoja));
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

function limparValorCsv(valor) {
  return String(valor ?? "")
    .replace(/;/g, ",")
    .replace(/\n/g, " ");
}

function montarLinhaCsv(valores) {
  return valores.map((valor) => limparValorCsv(valor)).join(";");
}

function baixarCsv(nomeArquivo, linhas) {
  const conteudo = "\uFEFF" + linhas.join("\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function registrarHistoricoRelatorio(tipo, formato, filtros) {
  const relatorios = buscarRelatoriosExportados();
  const usuario = obterUsuarioLogado();

  relatorios.push({
    id: Date.now(),
    dataHora: new Date().toISOString(),
    tipo: tipo,
    formato: formato,
    usuario: usuario.nome,
    filtros: filtros,
  });

  salvarRelatoriosExportados(relatorios);
}

function carregarCardsRelatorios() {
  const lojas = buscarLojasSalvas();
  const envios = buscarEnviosSalvos();
  const recebimentos = buscarRecebimentosSalvos();
  const relatorios = buscarRelatoriosExportados();

  const lojasCriticas = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Crítico",
  );

  document.getElementById("totalRelatoriosExportados").textContent =
    relatorios.length;
  document.getElementById("lojasCriticasRelatorio").textContent =
    lojasCriticas.length;
  document.getElementById("totalEnviosRelatorio").textContent = envios.length;
  document.getElementById("totalRecebimentosRelatorio").textContent =
    recebimentos.length;
}

function carregarTabelaHistoricoRelatorios() {
  const tabela = document.getElementById("tabelaRelatoriosExportados");
  if (!tabela) return;
  tabela.innerHTML = "";

  const relatorios = buscarRelatoriosExportados();

  relatorios.forEach((relatorio) => {
    tabela.innerHTML += `
            <tr>
                <td>${formatarDataHora(relatorio.dataHora)}</td>
                <td>${relatorio.tipo}</td>
                <td>${relatorio.formato}</td>
                <td>${relatorio.usuario}</td>
                <td>${relatorio.filtros}</td>
            </tr>
        `;
  });

  aplicarResponsividadeTabelas();
}

function exportarRelatorioEstoqueGeral() {
  const lojas = buscarLojasSalvas();
  if (lojas.length === 0) {
    mostrarAlerta("Nenhuma loja cadastrada para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Código",
    "Nome",
    "Estoque Atual",
    "Estoque Mínimo",
    "Estoque Recomendado",
    "Status",
  ]);
  const linhas = lojas.map((loja) =>
    montarLinhaCsv([
      loja.codigo,
      loja.nome,
      obterEstoqueAtual(loja),
      obterEstoqueMinimo(loja),
      obterEstoqueRecomendado(loja),
      obterStatusEstoque(loja),
    ]),
  );

  baixarCsv("relatorio-estoque-geral.csv", [cabecalho, ...linhas]);
  registrarHistoricoRelatorio("Estoque Geral", "CSV", "Todas as lojas");
  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();
  mostrarAlerta("Relatório de estoque geral exportado com sucesso.");
}

function exportarRelatorioEstoqueCritico() {
  const lojas = buscarLojasSalvas();
  const lojasCriticas = lojas.filter(
    (loja) => obterStatusEstoque(loja) === "Crítico",
  );

  if (lojasCriticas.length === 0) {
    mostrarAlerta("Nenhuma loja crítica encontrada.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Código",
    "Nome",
    "Estoque Atual",
    "Estoque Mínimo",
    "Status",
  ]);
  const linhas = lojasCriticas.map((loja) =>
    montarLinhaCsv([
      loja.codigo,
      loja.nome,
      obterEstoqueAtual(loja),
      obterEstoqueMinimo(loja),
      obterStatusEstoque(loja),
    ]),
  );

  baixarCsv("relatorio-estoque-critico.csv", [cabecalho, ...linhas]);
  registrarHistoricoRelatorio(
    "Estoque Crítico",
    "CSV",
    "Lojas com estoque atual menor ou igual ao mínimo",
  );
  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();
  mostrarAlerta("Relatório de estoque crítico exportado com sucesso.");
}

function exportarRelatorioEnvios() {
  const envios = buscarEnviosSalvos();
  if (envios.length === 0) {
    mostrarAlerta("Nenhum envio registrado para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Data/Hora",
    "Loja",
    "Quantidade",
    "Remessa",
    "Responsável",
    "Status",
  ]);
  const linhas = envios.map((envio) => {
    const codigoLoja = envio.codigoLoja || envio.lojaCodigo || "";
    const loja = buscarLojaPorCodigo(codigoLoja);
    return montarLinhaCsv([
      formatarDataHora(envio.dataHora),
      loja ? loja.nome : "Loja desconhecida",
      envio.quantidade || envio.quantidadeEnviada || 0,
      envio.remessa || envio.codigoRemessa || "-",
      envio.responsavel || "-",
      envio.status || "-",
    ]);
  });

  baixarCsv("relatorio-envios.csv", [cabecalho, ...linhas]);
  registrarHistoricoRelatorio("Envios", "CSV", "Todos os envios registrados");
  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();
  mostrarAlerta("Relatório de envios exportado com sucesso.");
}

function exportarRelatorioRecebimentos() {
  const recebimentos = buscarRecebimentosSalvos();
  if (recebimentos.length === 0) {
    mostrarAlerta("Nenhum recebimento registrado para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Data/Hora",
    "Loja",
    "Quantidade Recebida",
    "Responsável",
    "Status",
    "Observação",
  ]);
  const linhas = recebimentos.map((recebimento) => {
    const codigoLoja = recebimento.codigoLoja || recebimento.lojaCodigo || "";
    const loja = buscarLojaPorCodigo(codigoLoja);
    return montarLinhaCsv([
      formatarDataHora(recebimento.dataHora),
      loja ? loja.nome : "Loja desconhecida",
      recebimento.quantidadeRecebida || recebimento.quantidade || 0,
      recebimento.responsavel || "-",
      recebimento.status || "Recebido",
      recebimento.observacao || "-",
    ]);
  });

  baixarCsv("relatorio-recebimentos.csv", [cabecalho, ...linhas]);
  registrarHistoricoRelatorio(
    "Recebimentos",
    "CSV",
    "Todos os recebimentos confirmados",
  );
  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();
  mostrarAlerta("Relatório de recebimentos exportado com sucesso.");
}

function exportarRelatorioManutencoes() {
  const manutencoes = buscarManutencoesSalvas();
  if (manutencoes.length === 0) {
    mostrarAlerta("Nenhuma manutenção registrada para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Data/Hora",
    "Loja",
    "Tipo",
    "Quantidade",
    "Estoque Anterior",
    "Estoque Atualizado",
    "Responsável",
    "Motivo",
    "Observação",
  ]);
  const linhas = manutencoes.map((manutencao) => {
    const loja = buscarLojaPorCodigo(manutencao.codigoLoja);
    return montarLinhaCsv([
      formatarDataHora(manutencao.dataHora),
      loja ? loja.nome : "Loja desconhecida",
      manutencao.tipo,
      manutencao.quantidade,
      manutencao.estoqueAnterior,
      manutencao.estoqueAtualizado,
      manutencao.responsavel,
      manutencao.motivo,
      manutencao.observacao || "-",
    ]);
  });

  baixarCsv("relatorio-manutencoes.csv", [cabecalho, ...linhas]);
  registrarHistoricoRelatorio(
    "Manutenções",
    "CSV",
    "Todas as manutenções de estoque",
  );
  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();
  mostrarAlerta("Relatório de manutenções exportado com sucesso.");
}

document.addEventListener("DOMContentLoaded", function () {
  carregarUsuarioLogado();
  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();
});
