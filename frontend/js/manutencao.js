let manutencoesCarregadas = [];
let estoquesCarregados = [];

async function buscarManutencoesApi() {
  return await apiFetch("/api/manutencoes");
}

async function buscarEstoquesApi() {
  return await apiFetch("/api/estoques");
}

async function cadastrarManutencaoApi(dadosManutencao) {
  return await apiFetch("/api/manutencoes", {
    method: "POST",
    body: JSON.stringify(dadosManutencao),
  });
}

function obterUsuarioAtualManutencao() {
  if (typeof buscarUsuarioLogado === "function") {
    return buscarUsuarioLogado();
  }

  const usuarioSalvo = localStorage.getItem("usuarioLogado");

  if (!usuarioSalvo) {
    return null;
  }

  return JSON.parse(usuarioSalvo);
}

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

function formatarTipoManutencao(tipo) {
  if (tipo === "AJUSTE_ENTRADA") return "Ajuste de Entrada";
  if (tipo === "AJUSTE_SAIDA") return "Ajuste de Saída";
  if (tipo === "AVARIA") return "Avaria";
  if (tipo === "EXTRAVIO") return "Extravio";
  if (tipo === "CORRECAO") return "Correção";

  return tipo || "-";
}

function obterClasseTipoManutencao(tipo) {
  if (tipo === "AJUSTE_ENTRADA") {
    return "badge-normal";
  }

  if (tipo === "AJUSTE_SAIDA" || tipo === "AVARIA" || tipo === "EXTRAVIO") {
    return "badge-critico";
  }

  return "badge-atencao";
}

function tipoEhSaida(tipo) {
  return tipo === "AJUSTE_SAIDA" || tipo === "AVARIA" || tipo === "EXTRAVIO";
}

async function carregarLojasNoFormulario() {
  const selectLoja = document.getElementById("lojaManutencao");

  if (!selectLoja) {
    return;
  }

  try {
    const estoques = await buscarEstoquesApi();
    estoquesCarregados = estoques;

    selectLoja.innerHTML = "";

    if (estoques.length === 0) {
      selectLoja.innerHTML = `<option value="">Nenhuma loja disponível</option>`;
      return;
    }

    estoques.forEach(function (estoque) {
      selectLoja.innerHTML += `
        <option value="${estoque.lojaId}">
          ${estoque.codigoLoja} - ${estoque.nomeLoja} | Estoque: ${estoque.estoqueAtual}
        </option>
      `;
    });
  } catch (erro) {
    console.error("Erro ao carregar lojas no formulário:", erro);
    mostrarAlerta("Não foi possível carregar as lojas.", true);
  }
}

function preencherResponsavelManutencao() {
  const usuario = obterUsuarioAtualManutencao();
  const inputResponsavel = document.getElementById("responsavelManutencao");

  if (inputResponsavel) {
    inputResponsavel.value = usuario?.nome || "Usuário";
  }
}

async function carregarCardsManutencao() {
  try {
    const manutencoes = await buscarManutencoesApi();
    manutencoesCarregadas = manutencoes;

    const totalManutencoes = manutencoes.length;

    const entradas = manutencoes.filter(function (manutencao) {
      return manutencao.tipoManutencao === "AJUSTE_ENTRADA";
    }).length;

    const saidas = manutencoes.filter(function (manutencao) {
      return tipoEhSaida(manutencao.tipoManutencao);
    }).length;

    const lojasAjustadas = new Set(
      manutencoes.map(function (manutencao) {
        return manutencao.codigoLoja;
      }),
    ).size;

    const totalManutencoesEl = document.getElementById("totalManutencoes");
    const entradasManuaisEl = document.getElementById("entradasManuais");
    const saidasManuaisEl = document.getElementById("saidasManuais");
    const lojasAjustadasEl = document.getElementById("lojasAjustadas");

    if (totalManutencoesEl) {
      totalManutencoesEl.textContent = totalManutencoes;
    }

    if (entradasManuaisEl) {
      entradasManuaisEl.textContent = entradas;
    }

    if (saidasManuaisEl) {
      saidasManuaisEl.textContent = saidas;
    }

    if (lojasAjustadasEl) {
      lojasAjustadasEl.textContent = lojasAjustadas;
    }
  } catch (erro) {
    console.error("Erro ao carregar cards de manutenção:", erro);
    mostrarAlerta(
      "Não foi possível carregar os indicadores de manutenção.",
      true,
    );
  }
}

async function carregarTabelaManutencoes() {
  const tabela = document.getElementById("tabelaManutencoes");

  if (!tabela) {
    return;
  }

  try {
    tabela.innerHTML = "";

    const manutencoes = await buscarManutencoesApi();
    manutencoesCarregadas = manutencoes;

    if (manutencoes.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            Nenhuma manutenção encontrada para o seu usuário.
          </td>
        </tr>
      `;
      return;
    }

    manutencoes.forEach(function (manutencao) {
      const classeTipo = obterClasseTipoManutencao(manutencao.tipoManutencao);

      tabela.innerHTML += `
        <tr>
          <td>${formatarDataHora(manutencao.criadoEm)}</td>
          <td>${manutencao.codigoLoja || "-"} - ${manutencao.nomeLoja || "-"}</td>
          <td>
            <span class="badge-status ${classeTipo}">
              ${formatarTipoManutencao(manutencao.tipoManutencao)}
            </span>
          </td>
          <td>${manutencao.quantidade ?? 0}</td>
          <td>${manutencao.usuarioResponsavelNome || manutencao.usuarioResponsavelId || "Não informado"}</td>
          <td>${manutencao.observacao || "-"}</td>
        </tr>
      `;
    });

    if (typeof aplicarResponsividadeTabelas === "function") {
      aplicarResponsividadeTabelas();
    }
  } catch (erro) {
    console.error("Erro ao carregar tabela de manutenções:", erro);
    mostrarAlerta("Não foi possível carregar as manutenções.", true);
  }
}

async function abrirFormularioManutencao() {
  const formManutencao = document.getElementById("formManutencao");

  if (formManutencao) {
    formManutencao.reset();
  }

  await carregarLojasNoFormulario();
  preencherResponsavelManutencao();

  document.getElementById("formManutencaoContainer").classList.remove("hidden");
  document.getElementById("formManutencaoOverlay").classList.remove("hidden");
}

function fecharFormularioManutencao() {
  document.getElementById("formManutencaoContainer").classList.add("hidden");
  document.getElementById("formManutencaoOverlay").classList.add("hidden");
}

async function salvarManutencao(event) {
  event.preventDefault();

  const usuario = obterUsuarioAtualManutencao();

  if (!usuario || !usuario.id) {
    mostrarAlerta("Usuário não autenticado.", true);
    return;
  }

  const lojaId = Number(document.getElementById("lojaManutencao").value);
  const tipoManutencao = document.getElementById("tipoManutencao").value;

  const quantidade = Number(
    document.getElementById("quantidadeManutencao").value,
  );

  const motivo = document.getElementById("motivoManutencao").value.trim();

  const observacaoExtra = document
    .getElementById("observacaoManutencao")
    .value.trim();

  if (!lojaId) {
    mostrarAlerta("Selecione uma loja.");
    return;
  }

  if (!tipoManutencao) {
    mostrarAlerta("Selecione o tipo de manutenção.");
    return;
  }

  if (Number.isNaN(quantidade) || quantidade <= 0) {
    mostrarAlerta("Informe uma quantidade válida.");
    return;
  }

  if (!motivo) {
    mostrarAlerta("Informe o motivo da manutenção.");
    return;
  }

  if (tipoManutencao === "CORRECAO") {
    mostrarAlerta("Correção será implementada em uma próxima etapa.");
    return;
  }

  const estoqueSelecionado = estoquesCarregados.find(function (estoque) {
    return Number(estoque.lojaId) === lojaId;
  });

  if (!estoqueSelecionado) {
    mostrarAlerta("Estoque da loja não encontrado.", true);
    return;
  }

  if (
    tipoEhSaida(tipoManutencao) &&
    quantidade > Number(estoqueSelecionado.estoqueAtual)
  ) {
    mostrarAlerta("A manutenção deixaria o estoque negativo.");
    return;
  }

  const observacao = observacaoExtra
    ? `${motivo} - ${observacaoExtra}`
    : motivo;

  const novaManutencao = {
    lojaId,
    usuarioId: usuario.id,
    tipoManutencao,
    quantidade,
    observacao,
  };

  try {
    await cadastrarManutencaoApi(novaManutencao);

    await carregarCardsManutencao();
    await carregarTabelaManutencoes();

    fecharFormularioManutencao();

    mostrarAlerta("Manutenção registrada e estoque atualizado com sucesso.");
  } catch (erro) {
    console.error("Erro ao cadastrar manutenção:", erro);
    mostrarAlerta(erro.message, true);
  }
}

async function iniciarPaginaManutencao() {
  const usuario = carregarUsuarioLogado();

  if (!usuario) {
    return;
  }

  const formManutencao = document.getElementById("formManutencao");

  if (formManutencao) {
    formManutencao.addEventListener("submit", salvarManutencao);
  }

  await carregarCardsManutencao();
  await carregarTabelaManutencoes();

  if (typeof aplicarPermissoesMenu === "function") {
    aplicarPermissoesMenu();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarPaginaManutencao();
});
