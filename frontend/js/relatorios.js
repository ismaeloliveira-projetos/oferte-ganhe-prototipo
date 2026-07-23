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

async function exportarRelatorioBackend({
  caminho,
  nomeArquivo,
  tipo,
  filtros,
  mensagemSucesso,
}) {
  await apiDownload(caminho, nomeArquivo);

  registrarHistoricoRelatorio(tipo, "CSV", filtros);
  carregarCardsRelatorios();
  carregarTabelaHistoricoRelatorios();

  mostrarAlerta(mensagemSucesso);
}

async function exportarRelatorioEstoqueGeral() {
  try {
    if (dadosRelatorios.estoques.length === 0) {
      mostrarAlerta("Nenhum estoque encontrado para exportar.");
      return;
    }

    await exportarRelatorioBackend({
      caminho: "/api/relatorios/exportar/estoque-geral",
      nomeArquivo: "relatorio-estoque-geral.csv",
      tipo: "Estoque Geral",
      filtros: "Todas as lojas",
      mensagemSucesso: "Relatório de estoque geral exportado com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao exportar relatório de estoque geral:", erro);
    mostrarAlerta("Erro ao exportar relatório de estoque geral.", true);
  }
}

async function exportarRelatorioEstoqueCritico() {
  try {
    const estoquesCriticos = dadosRelatorios.estoques.filter(
      function (estoque) {
        return obterStatusEstoque(estoque) === "Crítico";
      },
    );

    if (estoquesCriticos.length === 0) {
      mostrarAlerta("Nenhuma loja crítica encontrada.");
      return;
    }

    await exportarRelatorioBackend({
      caminho: "/api/relatorios/exportar/estoque-critico",
      nomeArquivo: "relatorio-estoque-critico.csv",
      tipo: "Estoque Crítico",
      filtros: "Lojas com estoque atual menor ou igual ao mínimo",
      mensagemSucesso: "Relatório de estoque crítico exportado com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao exportar relatório de estoque crítico:", erro);
    mostrarAlerta("Erro ao exportar relatório de estoque crítico.", true);
  }
}

async function exportarRelatorioEnvios() {
  try {
    if (dadosRelatorios.envios.length === 0) {
      mostrarAlerta("Nenhum envio registrado para exportar.");
      return;
    }

    await exportarRelatorioBackend({
      caminho: "/api/relatorios/exportar/envios",
      nomeArquivo: "relatorio-envios.csv",
      tipo: "Envios",
      filtros: "Todos os envios registrados",
      mensagemSucesso: "Relatório de envios exportado com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao exportar relatório de envios:", erro);
    mostrarAlerta("Erro ao exportar relatório de envios.", true);
  }
}

async function exportarRelatorioRecebimentos() {
  try {
    if (dadosRelatorios.recebimentos.length === 0) {
      mostrarAlerta("Nenhum recebimento registrado para exportar.");
      return;
    }

    await exportarRelatorioBackend({
      caminho: "/api/relatorios/exportar/recebimentos",
      nomeArquivo: "relatorio-recebimentos.csv",
      tipo: "Recebimentos",
      filtros: "Todos os recebimentos confirmados",
      mensagemSucesso: "Relatório de recebimentos exportado com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao exportar relatório de recebimentos:", erro);
    mostrarAlerta("Erro ao exportar relatório de recebimentos.", true);
  }
}

async function exportarRelatorioManutencoes() {
  try {
    if (dadosRelatorios.manutencoes.length === 0) {
      mostrarAlerta("Nenhuma manutenção registrada para exportar.");
      return;
    }

    await exportarRelatorioBackend({
      caminho: "/api/relatorios/exportar/manutencoes",
      nomeArquivo: "relatorio-manutencoes.csv",
      tipo: "Manutenções",
      filtros: "Todas as manutenções de estoque",
      mensagemSucesso: "Relatório de manutenções exportado com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao exportar relatório de manutenções:", erro);
    mostrarAlerta("Erro ao exportar relatório de manutenções.", true);
  }
}

async function exportarRelatorioUsuarios() {
  try {
    if (dadosRelatorios.usuarios.length === 0) {
      mostrarAlerta("Nenhum usuário cadastrado para exportar.");
      return;
    }

    await exportarRelatorioBackend({
      caminho: "/api/relatorios/exportar/usuarios",
      nomeArquivo: "relatorio-usuarios.csv",
      tipo: "Usuários",
      filtros: "Todos os usuários cadastrados",
      mensagemSucesso: "Relatório de usuários exportado com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao exportar relatório de usuários:", erro);
    mostrarAlerta("Erro ao exportar relatório de usuários.", true);
  }
}

async function exportarRelatorioPerfis() {
  try {
    if (dadosRelatorios.perfis.length === 0) {
      mostrarAlerta("Nenhum perfil cadastrado para exportar.");
      return;
    }

    await exportarRelatorioBackend({
      caminho: "/api/relatorios/exportar/perfis",
      nomeArquivo: "relatorio-perfis.csv",
      tipo: "Perfis",
      filtros: "Todos os perfis de acesso",
      mensagemSucesso: "Relatório de perfis exportado com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao exportar relatório de perfis:", erro);
    mostrarAlerta("Erro ao exportar relatório de perfis.", true);
  }
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
