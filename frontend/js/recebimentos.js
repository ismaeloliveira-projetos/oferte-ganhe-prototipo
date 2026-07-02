let recebimentosCarregados = [];
let enviosCarregados = [];

// Funções para interagir com a API do backend
async function buscarRecebimentosApi() {
  const resposta = await fetch("http://localhost:3000/api/recebimentos");

  if (!resposta.ok) {
    throw new Error("Erro ao buscar recebimentos no backend.");
  }

  return await resposta.json();
}

async function buscarEnviosApi() {
  const resposta = await fetch("http://localhost:3000/api/envios");

  if (!resposta.ok) {
    throw new Error("Erro ao buscar envios no backend.");
  }

  return await resposta.json();
}

async function confirmarRecebimentoApi(novoRecebimento) {
  const resposta = await fetch("http://localhost:3000/api/recebimentos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(novoRecebimento),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao confirmar recebimento.");
  }

  return dados;
}

function mostrarAlerta(mensagem) {
  const alerta = document.getElementById("alertaSistema");
  alerta.textContent = mensagem;
  alerta.classList.remove("hidden");
  setTimeout(() => alerta.classList.add("hidden"), 3000);
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "-";
  const data = new Date(dataHora);
  if (isNaN(data.getTime())) return dataHora;
  return data.toLocaleString("pt-BR");
}

async function carregarCardsRecebimentos() {
  try {
    const recebimentos = await buscarRecebimentosApi();
    const envios = await buscarEnviosApi();

    recebimentosCarregados = recebimentos;
    enviosCarregados = envios;

    const totalRecebimentos = recebimentos.length;

    const totalTaloesRecebidos = recebimentos.reduce(
      (total, recebimento) => total + Number(recebimento.quantidadeRecebida),
      0,
    );

    const enviosPendentes = envios.filter(
      (envio) => envio.status === "PENDENTE",
    ).length;

    const lojasAtualizadas = new Set(
      recebimentos.map((recebimento) => recebimento.codigoLoja),
    ).size;

    document.getElementById("totalRecebimentos").textContent =
      totalRecebimentos;

    document.getElementById("totalTaloesRecebidos").textContent =
      totalTaloesRecebidos;

    document.getElementById("enviosPendentesRecebimento").textContent =
      enviosPendentes;

    document.getElementById("lojasAtualizadasRecebimento").textContent =
      lojasAtualizadas;

    await atualizarSininhoRecebimentos();
  } catch (erro) {
    console.error("Erro ao carregar cards de recebimentos:", erro);
    mostrarAlerta("Não foi possível carregar os indicadores de recebimentos.");
  }
}

async function carregarTabelaRecebimentos() {
  const tabela = document.getElementById("tabelaRecebimentos");

  if (!tabela) return;

  try {
    tabela.innerHTML = "";

    const recebimentos = await buscarRecebimentosApi();
    recebimentosCarregados = recebimentos;

    recebimentos.forEach(function (recebimento) {
      tabela.innerHTML += `
        <tr>
          <td>${formatarDataHora(recebimento.dataRecebimento)}</td>
          <td>${recebimento.codigoLoja} - ${recebimento.nomeLoja}</td>
          <td>${recebimento.quantidadeRecebida}</td>
          <td>${recebimento.usuarioRecebimentoId || "Não informado"}</td>
          <td><span class="badge-status badge-normal">Confirmado</span></td>
          <td>${recebimento.observacao || "-"}</td>
        </tr>
      `;
    });

    aplicarResponsividadeTabelas();
  } catch (erro) {
    console.error("Erro ao carregar tabela de recebimentos:", erro);
    mostrarAlerta("Não foi possível carregar os recebimentos.");
  }
}

async function carregarEnviosPendentesNoFormulario() {
  const selectEnvio = document.getElementById("envioRecebimento");

  if (!selectEnvio) return;

  try {
    const envios = await buscarEnviosApi();

    enviosCarregados = envios;

    const enviosPendentes = envios.filter(
      (envio) => envio.status === "PENDENTE",
    );

    selectEnvio.innerHTML = "";

    if (enviosPendentes.length === 0) {
      selectEnvio.innerHTML = `<option value="">Nenhum envio pendente</option>`;
      return;
    }

    enviosPendentes.forEach((envio) => {
      selectEnvio.innerHTML += `
        <option value="${envio.id}">
          ${envio.codigoLoja} - ${envio.nomeLoja} | ${envio.quantidadeEnviada} talões | ${envio.codigoRemessa}
        </option>
      `;
    });

    preencherQuantidadeDoEnvioSelecionado();
  } catch (erro) {
    console.error("Erro ao carregar envios pendentes:", erro);
    mostrarAlerta("Não foi possível carregar os envios pendentes.");
  }
}

// Função para preencher a quantidade de talões do envio selecionado no formulário
function preencherQuantidadeDoEnvioSelecionado() {
  const selectEnvio = document.getElementById("envioRecebimento");
  const inputQuantidade = document.getElementById("quantidadeRecebida");

  if (!selectEnvio || !inputQuantidade) return;

  const envioSelecionado = enviosCarregados.find(
    (envio) => String(envio.id) === String(selectEnvio.value),
  );

  if (!envioSelecionado) {
    inputQuantidade.value = "";
    return;
  }

  inputQuantidade.value = envioSelecionado.quantidadeEnviada;
}
// Adiciona o evento de mudança ao select de envios para atualizar a quantidade automaticamente
const selectEnvioRecebimento = document.getElementById("envioRecebimento");

if (selectEnvioRecebimento) {
  selectEnvioRecebimento.addEventListener(
    "change",
    preencherQuantidadeDoEnvioSelecionado,
  );
}

async function abrirFormularioRecebimento() {
  document.getElementById("formRecebimento").reset();

  await carregarEnviosPendentesNoFormulario();

  document
    .getElementById("formRecebimentoContainer")
    .classList.remove("hidden");

  document.getElementById("formRecebimentoOverlay").classList.remove("hidden");
}

function fecharFormularioRecebimento() {
  document.getElementById("formRecebimentoContainer").classList.add("hidden");
  document.getElementById("formRecebimentoOverlay").classList.add("hidden");
}

document.getElementById("formRecebimento");

const formRecebimento = document.getElementById("formRecebimento");

if (formRecebimento) {
  formRecebimento.addEventListener("submit", async function (event) {
    event.preventDefault();

    const envioId = Number(document.getElementById("envioRecebimento").value);

    const quantidadeRecebida = Number(
      document.getElementById("quantidadeRecebida").value,
    );

    const observacao = document
      .getElementById("observacaoRecebimento")
      .value.trim();

    if (!envioId) {
      mostrarAlerta("Selecione um envio pendente.");
      return;
    }

    if (quantidadeRecebida <= 0) {
      mostrarAlerta("Informe uma quantidade válida.");
      return;
    }

    const envioSelecionado = enviosCarregados.find(
      (envio) => Number(envio.id) === envioId,
    );

    if (!envioSelecionado) {
      mostrarAlerta("Envio não encontrado.");
      return;
    }

    if (envioSelecionado.status !== "PENDENTE") {
      mostrarAlerta("Este envio já foi recebido.");
      return;
    }

    if (quantidadeRecebida !== Number(envioSelecionado.quantidadeEnviada)) {
      mostrarAlerta(
        "Por enquanto, o recebimento precisa ser total, igual à quantidade enviada.",
      );
      return;
    }

    const novoRecebimento = {
      envioId,
      quantidadeRecebida,
      usuarioRecebimentoId: null,
      observacao: observacao || "Recebimento confirmado pela tela.",
    };

    try {
      await confirmarRecebimentoApi(novoRecebimento);

      await carregarCardsRecebimentos();
      await carregarTabelaRecebimentos();
      await detectarAnomalias();

      fecharFormularioRecebimento();

      mostrarAlerta("Recebimento confirmado e estoque atualizado com sucesso.");
    } catch (erro) {
      console.error("Erro ao confirmar recebimento:", erro);
      mostrarAlerta(erro.message);
    }
  });
}

async function atualizarSininhoRecebimentos() {
  try {
    const envios = await buscarEnviosApi();

    enviosCarregados = envios;

    const enviosPendentes = envios.filter(
      (envio) => envio.status === "PENDENTE",
    ).length;

    const contador = document.getElementById("contadorEnviosPendentes");
    const botaoSininho = document.querySelector(".notification-button");

    if (!contador || !botaoSininho) return;

    if (enviosPendentes > 0) {
      contador.textContent = enviosPendentes;
      contador.classList.remove("hidden");
      botaoSininho.classList.add("has-notification");
    } else {
      contador.textContent = "0";
      contador.classList.add("hidden");
      botaoSininho.classList.remove("has-notification");
    }
  } catch (erro) {
    console.error("Erro ao atualizar sininho:", erro);
  }
}

async function detectarAnomalias() {
  try {
    const recebimentos = await buscarRecebimentosApi();

    const banner = document.getElementById("alertaAnomalias");
    const mensagem = document.getElementById("mensagemAnomalias");

    if (!banner || !mensagem) return;

    const recebimentosPorLoja = {};

    recebimentos.forEach(function (recebimento) {
      if (!recebimentosPorLoja[recebimento.codigoLoja]) {
        recebimentosPorLoja[recebimento.codigoLoja] = {
          nomeLoja: recebimento.nomeLoja,
          total: 0,
        };
      }

      recebimentosPorLoja[recebimento.codigoLoja].total += Number(
        recebimento.quantidadeRecebida,
      );
    });

    const valores = Object.values(recebimentosPorLoja).map(
      (item) => item.total,
    );

    if (valores.length < 2) {
      banner.classList.add("hidden");
      return;
    }

    const media = valores.reduce((a, b) => a + b, 0) / valores.length;

    const anomalias = Object.values(recebimentosPorLoja)
      .filter((item) => item.total > media * 1.5)
      .map((item) => item.nomeLoja);

    if (anomalias.length > 0) {
      mensagem.textContent = `${anomalias.join(", ")} com volume de recebimento acima da média. Recomenda-se revisão manual.`;
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  } catch (erro) {
    console.error("Erro ao detectar anomalias:", erro);
  }
}

async function iniciarPaginaRecebimentos() {
  carregarUsuarioLogado();

  await carregarCardsRecebimentos();
  await carregarTabelaRecebimentos();
  await atualizarSininhoRecebimentos();
  await detectarAnomalias();
}

iniciarPaginaRecebimentos();
