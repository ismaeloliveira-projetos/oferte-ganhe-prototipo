let dadosRelatorios = {
  estoques: [],
  envios: [],
  recebimentos: [],
  manutencoes: [],
  usuarios: [],
  perfis: [],
};

let historicoRelatorios = [];

function mostrarAlerta(mensagem, erro = false) {
  const alerta = document.getElementById("alertaSistema");

  if (!alerta) {
    if (typeof mostrarToast === "function") {
      mostrarToast(mensagem, erro);
      return;
    }

    alert(mensagem);
    return;
  }

  alerta.textContent = mensagem;
  alerta.classList.remove("hidden");

  setTimeout(function () {
    alerta.classList.add("hidden");
  }, 3000);
}

function obterUsuarioAtualRelatorio() {
  if (typeof buscarUsuarioLogado === "function") {
    return buscarUsuarioLogado();
  }

  const usuarioSalvo = localStorage.getItem("usuarioLogado");

  if (!usuarioSalvo) {
    return null;
  }

  return JSON.parse(usuarioSalvo);
}

function formatarDataHora(dataHora) {
  if (!dataHora) {
    return "-";
  }

  const data = new Date(dataHora);

  if (Number.isNaN(data.getTime())) {
    return dataHora;
  }

  return data.toLocaleString("pt-BR");
}

function limparValorCsv(valor) {
  return String(valor ?? "")
    .replace(/;/g, ",")
    .replace(/\n/g, " ");
}

function montarLinhaCsv(valores) {
  return valores
    .map(function (valor) {
      return limparValorCsv(valor);
    })
    .join(";");
}

function baixarCsv(nomeArquivo, linhas) {
  const conteudo = "\uFEFF" + linhas.join("\n");

  const blob = new Blob([conteudo], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

async function buscarApi(caminho) {
  return await apiFetch(caminho);
}

function obterStatusEstoque(item) {
  if (item.statusEstoque) {
    return item.statusEstoque;
  }

  if (item.status) {
    return item.status;
  }

  const estoqueAtual = obterEstoqueAtual(item);
  const estoqueMinimo = obterEstoqueMinimo(item);
  const estoqueRecomendado = obterEstoqueRecomendado(item);

  if (estoqueAtual <= estoqueMinimo) {
    return "Crítico";
  }

  if (estoqueAtual < estoqueRecomendado) {
    return "Atenção";
  }

  return "Normal";
}

function obterNomeLoja(item) {
  return (
    item.nomeLoja ||
    item.nome_loja ||
    item.lojaNome ||
    item.nome ||
    item.loja ||
    "-"
  );
}

function obterCodigoLoja(item) {
  return (
    item.codigoLoja || item.codigo_loja || item.lojaCodigo || item.codigo || "-"
  );
}

function obterEstoqueAtual(item) {
  return Number(
    item.estoqueAtual ??
      item.estoque_atual ??
      item.quantidadeAtual ??
      item.saldoAtual ??
      0,
  );
}

function obterEstoqueMinimo(item) {
  return Number(
    item.estoqueMinimo ??
      item.estoque_minimo ??
      item.quantidadeMinima ??
      item.minimo ??
      0,
  );
}

function obterEstoqueRecomendado(item) {
  return Number(
    item.estoqueRecomendado ??
      item.estoque_recomendado ??
      item.quantidadeRecomendada ??
      item.recomendado ??
      0,
  );
}

function obterQuantidadeEnvio(envio) {
  return Number(
    envio.quantidadeEnviada ??
      envio.quantidade_enviada ??
      envio.quantidade ??
      0,
  );
}

function obterQuantidadeRecebida(recebimento) {
  return Number(
    recebimento.quantidadeRecebida ??
      recebimento.quantidade_recebida ??
      recebimento.quantidade ??
      0,
  );
}

function obterNomeUsuario(item) {
  return (
    item.usuarioNome ||
    item.usuario_nome ||
    item.usuarioResponsavel ||
    item.usuarioResponsavelNome ||
    item.responsavel ||
    item.usuarioId ||
    item.usuario_id ||
    "-"
  );
}

function registrarHistoricoRelatorio(tipo, formato, filtros) {
  const usuario = obterUsuarioAtualRelatorio();

  historicoRelatorios.push({
    id: Date.now(),
    dataHora: new Date().toISOString(),
    tipo,
    formato,
    usuario: usuario?.nome || "Usuário",
    filtros,
  });
}

function carregarCardsRelatorios() {
  const lojasCriticas = dadosRelatorios.estoques.filter(function (estoque) {
    return obterStatusEstoque(estoque) === "Crítico";
  });

  const totalRelatoriosExportados = document.getElementById(
    "totalRelatoriosExportados",
  );

  const lojasCriticasRelatorio = document.getElementById(
    "lojasCriticasRelatorio",
  );

  const totalEnviosRelatorio = document.getElementById("totalEnviosRelatorio");
  const totalRecebimentosRelatorio = document.getElementById(
    "totalRecebimentosRelatorio",
  );

  if (totalRelatoriosExportados) {
    totalRelatoriosExportados.textContent = historicoRelatorios.length;
  }

  if (lojasCriticasRelatorio) {
    lojasCriticasRelatorio.textContent = lojasCriticas.length;
  }

  if (totalEnviosRelatorio) {
    totalEnviosRelatorio.textContent = dadosRelatorios.envios.length;
  }

  if (totalRecebimentosRelatorio) {
    totalRecebimentosRelatorio.textContent =
      dadosRelatorios.recebimentos.length;
  }
}

function carregarTabelaHistoricoRelatorios() {
  const tabela = document.getElementById("tabelaRelatoriosExportados");

  if (!tabela) {
    return;
  }

  tabela.innerHTML = "";

  if (historicoRelatorios.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="5">Nenhum relatório exportado nesta sessão.</td>
      </tr>
    `;
    return;
  }

  historicoRelatorios
    .slice()
    .reverse()
    .forEach(function (relatorio) {
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

  if (typeof aplicarResponsividadeTabelas === "function") {
    aplicarResponsividadeTabelas();
  }
}

async function carregarDadosRelatorios() {
  try {
    const [estoques, envios, recebimentos, manutencoes, usuarios, perfis] =
      await Promise.all([
        buscarApi("/api/estoques"),
        buscarApi("/api/envios"),
        buscarApi("/api/recebimentos"),
        buscarApi("/api/manutencoes"),
        buscarApi("/api/usuarios"),
        buscarApi("/api/perfis"),
      ]);

    dadosRelatorios = {
      estoques: Array.isArray(estoques) ? estoques : [],
      envios: Array.isArray(envios) ? envios : [],
      recebimentos: Array.isArray(recebimentos) ? recebimentos : [],
      manutencoes: Array.isArray(manutencoes) ? manutencoes : [],
      usuarios: Array.isArray(usuarios) ? usuarios : [],
      perfis: Array.isArray(perfis) ? perfis : [],
    };

    carregarCardsRelatorios();
    carregarTabelaHistoricoRelatorios();
  } catch (erro) {
    console.error("Erro ao carregar dados dos relatórios:", erro);
    mostrarAlerta("Erro ao carregar dados dos relatórios.", true);
  }
}

function exportarRelatorioEstoqueGeral() {
  const estoques = dadosRelatorios.estoques;

  if (estoques.length === 0) {
    mostrarAlerta("Nenhum estoque encontrado para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Código",
    "Loja",
    "Estoque Atual",
    "Estoque Mínimo",
    "Estoque Recomendado",
    "Status",
  ]);

  const linhas = estoques.map(function (estoque) {
    return montarLinhaCsv([
      obterCodigoLoja(estoque),
      obterNomeLoja(estoque),
      obterEstoqueAtual(estoque),
      obterEstoqueMinimo(estoque),
      obterEstoqueRecomendado(estoque),
      obterStatusEstoque(estoque),
    ]);
  });

  baixarCsv("relatorio-estoque-geral.csv", [cabecalho, ...linhas]);

  registrarHistoricoRelatorio("Estoque Geral", "CSV", "Todas as lojas");
  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();

  mostrarAlerta("Relatório de estoque geral exportado com sucesso.");
}

function exportarRelatorioEstoqueCritico() {
  const estoquesCriticos = dadosRelatorios.estoques.filter(function (estoque) {
    return obterStatusEstoque(estoque) === "Crítico";
  });

  if (estoquesCriticos.length === 0) {
    mostrarAlerta("Nenhuma loja crítica encontrada.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Código",
    "Loja",
    "Estoque Atual",
    "Estoque Mínimo",
    "Status",
  ]);

  const linhas = estoquesCriticos.map(function (estoque) {
    return montarLinhaCsv([
      obterCodigoLoja(estoque),
      obterNomeLoja(estoque),
      obterEstoqueAtual(estoque),
      obterEstoqueMinimo(estoque),
      obterStatusEstoque(estoque),
    ]);
  });

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
  const envios = dadosRelatorios.envios;

  if (envios.length === 0) {
    mostrarAlerta("Nenhum envio registrado para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Data/Hora",
    "Código da Loja",
    "Loja",
    "Quantidade",
    "Remessa",
    "Responsável",
    "Status",
  ]);

  const linhas = envios.map(function (envio) {
    return montarLinhaCsv([
      formatarDataHora(envio.dataHora || envio.criadoEm || envio.dataEnvio),
      obterCodigoLoja(envio),
      obterNomeLoja(envio),
      obterQuantidadeEnvio(envio),
      envio.remessa || envio.codigoRemessa || envio.codigo_remessa || "-",
      obterNomeUsuario(envio),
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
  const recebimentos = dadosRelatorios.recebimentos;

  if (recebimentos.length === 0) {
    mostrarAlerta("Nenhum recebimento registrado para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Data/Hora",
    "Código da Loja",
    "Loja",
    "Quantidade Recebida",
    "Responsável",
    "Status",
    "Observação",
  ]);

  const linhas = recebimentos.map(function (recebimento) {
    return montarLinhaCsv([
      formatarDataHora(
        recebimento.dataHora ||
          recebimento.criadoEm ||
          recebimento.dataRecebimento,
      ),
      obterCodigoLoja(recebimento),
      obterNomeLoja(recebimento),
      obterQuantidadeRecebida(recebimento),
      obterNomeUsuario(recebimento),
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
  const manutencoes = dadosRelatorios.manutencoes;

  if (manutencoes.length === 0) {
    mostrarAlerta("Nenhuma manutenção registrada para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Data/Hora",
    "Código da Loja",
    "Loja",
    "Tipo",
    "Quantidade",
    "Responsável",
    "Observação",
  ]);

  const linhas = manutencoes.map(function (manutencao) {
    return montarLinhaCsv([
      formatarDataHora(
        manutencao.dataHora || manutencao.criadoEm || manutencao.dataManutencao,
      ),
      obterCodigoLoja(manutencao),
      obterNomeLoja(manutencao),
      manutencao.tipo || manutencao.tipoManutencao || "-",
      manutencao.quantidade || 0,
      obterNomeUsuario(manutencao),
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

function exportarRelatorioUsuarios() {
  const usuarios = dadosRelatorios.usuarios;

  if (usuarios.length === 0) {
    mostrarAlerta("Nenhum usuário cadastrado para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Nome",
    "Matrícula",
    "E-mail",
    "Ativo",
    "Criado em",
  ]);

  const linhas = usuarios.map(function (usuario) {
    return montarLinhaCsv([
      usuario.nome || "-",
      usuario.matricula || "-",
      usuario.email || "-",
      usuario.ativo === false ? "Não" : "Sim",
      formatarDataHora(usuario.criadoEm || usuario.criado_em),
    ]);
  });

  baixarCsv("relatorio-usuarios.csv", [cabecalho, ...linhas]);

  registrarHistoricoRelatorio(
    "Usuários",
    "CSV",
    "Todos os usuários cadastrados",
  );

  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();

  mostrarAlerta("Relatório de usuários exportado com sucesso.");
}

function exportarRelatorioPerfis() {
  const perfis = dadosRelatorios.perfis;

  if (perfis.length === 0) {
    mostrarAlerta("Nenhum perfil cadastrado para exportar.");
    return;
  }

  const cabecalho = montarLinhaCsv([
    "Nome",
    "Nível",
    "Permissões",
    "Total de Permissões",
  ]);

  const linhas = perfis.map(function (perfil) {
    const permissoes = perfil.permissoes || [];

    return montarLinhaCsv([
      perfil.nomePerfil || perfil.nome_perfil || perfil.nome || "-",
      perfil.nivel || "-",
      Array.isArray(permissoes) ? permissoes.join(", ") : "-",
      Array.isArray(permissoes) ? permissoes.length : 0,
    ]);
  });

  baixarCsv("relatorio-perfis.csv", [cabecalho, ...linhas]);

  registrarHistoricoRelatorio("Perfis", "CSV", "Todos os perfis de acesso");

  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();

  mostrarAlerta("Relatório de perfis exportado com sucesso.");
}

async function iniciarPaginaRelatorios() {
  const usuario = carregarUsuarioLogado();

  if (!usuario) {
    return;
  }

  await carregarDadosRelatorios();

  if (typeof aplicarPermissoesMenu === "function") {
    aplicarPermissoesMenu();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarPaginaRelatorios();
});
