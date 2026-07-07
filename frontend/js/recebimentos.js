let recebimentosCarregados = [];
let enviosCarregados = [];

async function buscarRecebimentosApi() {
  const recebimentos = await apiFetch("/api/recebimentos");

  if (!Array.isArray(recebimentos)) {
    return [];
  }

  return recebimentos.map(normalizarRecebimento);
}

async function buscarEnviosApi() {
  const envios = await apiFetch("/api/envios");

  if (!Array.isArray(envios)) {
    return [];
  }

  return envios.map(normalizarEnvioRecebimento);
}

async function confirmarRecebimentoApi(dadosRecebimento) {
  return await apiFetch("/api/recebimentos", {
    method: "POST",
    body: JSON.stringify(dadosRecebimento),
  });
}

function obterUsuarioAtualRecebimento() {
  if (typeof buscarUsuarioLogado === "function") {
    return buscarUsuarioLogado();
  }

  const usuarioSalvo = localStorage.getItem("usuarioLogado");

  if (!usuarioSalvo) {
    return null;
  }

  return JSON.parse(usuarioSalvo);
}

function normalizarEnvioRecebimento(envio) {
  return {
    id: envio.id,

    lojaId: envio.lojaId ?? envio.loja_id ?? envio.idLoja ?? envio.id_loja,

    codigoLoja:
      envio.codigoLoja ??
      envio.codigo_loja ??
      envio.codigo ??
      envio.lojaCodigo ??
      envio.loja_codigo ??
      "-",

    nomeLoja:
      envio.nomeLoja ??
      envio.nome_loja ??
      envio.nome ??
      envio.lojaNome ??
      envio.loja_nome ??
      "-",

    quantidadeEnviada: Number(
      envio.quantidadeEnviada ??
        envio.quantidade_enviada ??
        envio.quantidade ??
        0,
    ),

    codigoRemessa:
      envio.codigoRemessa ?? envio.codigo_remessa ?? envio.remessa ?? "-",

    status: envio.status ?? "-",

    dataEnvio:
      envio.dataEnvio ??
      envio.data_envio ??
      envio.criadoEm ??
      envio.criado_em ??
      envio.dataHora ??
      envio.data_hora,
  };
}

function normalizarRecebimento(recebimento) {
  return {
    id: recebimento.id,

    envioId: recebimento.envioId ?? recebimento.envio_id,

    lojaId:
      recebimento.lojaId ??
      recebimento.loja_id ??
      recebimento.idLoja ??
      recebimento.id_loja,

    codigoLoja:
      recebimento.codigoLoja ??
      recebimento.codigo_loja ??
      recebimento.codigo ??
      recebimento.lojaCodigo ??
      recebimento.loja_codigo ??
      "-",

    nomeLoja:
      recebimento.nomeLoja ??
      recebimento.nome_loja ??
      recebimento.nome ??
      recebimento.lojaNome ??
      recebimento.loja_nome ??
      "-",

    quantidadeRecebida: Number(
      recebimento.quantidadeRecebida ??
        recebimento.quantidade_recebida ??
        recebimento.quantidade ??
        0,
    ),

    usuarioRecebimentoId:
      recebimento.usuarioRecebimentoId ??
      recebimento.usuario_recebimento_id ??
      recebimento.usuarioResponsavelId ??
      recebimento.usuario_responsavel_id ??
      recebimento.usuarioId ??
      recebimento.usuario_id,

    usuarioRecebimentoNome:
      recebimento.usuarioRecebimentoNome ??
      recebimento.usuario_recebimento_nome ??
      recebimento.usuarioResponsavelNome ??
      recebimento.usuario_responsavel_nome ??
      recebimento.usuarioNome ??
      recebimento.usuario_nome,

    dataRecebimento:
      recebimento.dataRecebimento ??
      recebimento.data_recebimento ??
      recebimento.criadoEm ??
      recebimento.criado_em ??
      recebimento.dataHora ??
      recebimento.data_hora,

    observacao: recebimento.observacao ?? "-",
    status: recebimento.status ?? "CONFIRMADO",
  };
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

function preencherResponsavelRecebimento() {
  const usuario = obterUsuarioAtualRecebimento();
  const inputResponsavel = document.getElementById("responsavelRecebimento");

  if (inputResponsavel) {
    inputResponsavel.value = usuario?.nome || "Usuário";
  }
}

async function carregarCardsRecebimentos() {
  try {
    const recebimentos = await buscarRecebimentosApi();
    const envios = await buscarEnviosApi();

    recebimentosCarregados = recebimentos;
    enviosCarregados = envios;

    const totalRecebimentos = recebimentos.length;

    const totalTaloesRecebidos = recebimentos.reduce(function (
      total,
      recebimento,
    ) {
      return total + Number(recebimento.quantidadeRecebida || 0);
    }, 0);

    const enviosPendentes = envios.filter(function (envio) {
      return envio.status === "PENDENTE";
    }).length;

    const lojasAtualizadas = new Set(
      recebimentos.map(function (recebimento) {
        return recebimento.codigoLoja;
      }),
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
    mostrarAlerta(
      "Não foi possível carregar os indicadores de recebimentos.",
      true,
    );
  }
}

async function carregarTabelaRecebimentos() {
  const tabela = document.getElementById("tabelaRecebimentos");

  if (!tabela) {
    return;
  }

  try {
    tabela.innerHTML = "";

    const recebimentos = await buscarRecebimentosApi();
    recebimentosCarregados = recebimentos;

    if (recebimentos.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            Nenhum recebimento encontrado para o seu usuário.
          </td>
        </tr>
      `;
      return;
    }

    recebimentos.forEach(function (recebimento) {
      tabela.innerHTML += `
        <tr>
          <td>${formatarDataHora(recebimento.dataRecebimento)}</td>
          <td>${recebimento.codigoLoja} - ${recebimento.nomeLoja}</td>
          <td>${recebimento.quantidadeRecebida}</td>
          <td>${recebimento.usuarioRecebimentoNome || recebimento.usuarioRecebimentoId || "Não informado"}</td>
          <td>
            <span class="badge-status badge-normal">
              Confirmado
            </span>
          </td>
          <td>${recebimento.observacao || "-"}</td>
        </tr>
      `;
    });

    if (typeof aplicarResponsividadeTabelas === "function") {
      aplicarResponsividadeTabelas();
    }
  } catch (erro) {
    console.error("Erro ao carregar tabela de recebimentos:", erro);
    mostrarAlerta("Não foi possível carregar os recebimentos.", true);
  }
}

async function carregarEnviosPendentesNoFormulario() {
  const selectEnvio = document.getElementById("envioRecebimento");

  if (!selectEnvio) {
    return;
  }

  try {
    const envios = await buscarEnviosApi();

    enviosCarregados = envios;

    const enviosPendentes = envios.filter(function (envio) {
      return envio.status === "PENDENTE";
    });

    selectEnvio.innerHTML = "";

    if (enviosPendentes.length === 0) {
      selectEnvio.innerHTML = `<option value="">Nenhum envio pendente</option>`;
      return;
    }

    selectEnvio.innerHTML = `<option value="">Selecione um envio</option>`;

    enviosPendentes.forEach(function (envio) {
      selectEnvio.innerHTML += `
        <option value="${envio.id}">
          ${envio.codigoLoja} - ${envio.nomeLoja} | ${envio.quantidadeEnviada} talões | ${envio.codigoRemessa}
        </option>
      `;
    });

    preencherQuantidadeDoEnvioSelecionado();
  } catch (erro) {
    console.error("Erro ao carregar envios pendentes:", erro);
    mostrarAlerta("Não foi possível carregar os envios pendentes.", true);
  }
}

function preencherQuantidadeDoEnvioSelecionado() {
  const selectEnvio = document.getElementById("envioRecebimento");
  const inputQuantidade = document.getElementById("quantidadeRecebida");

  if (!selectEnvio || !inputQuantidade) {
    return;
  }

  const envioSelecionado = enviosCarregados.find(function (envio) {
    return String(envio.id) === String(selectEnvio.value);
  });

  if (!envioSelecionado) {
    inputQuantidade.value = "";
    return;
  }

  inputQuantidade.value = envioSelecionado.quantidadeEnviada;
}

async function abrirFormularioRecebimento() {
  const formRecebimento = document.getElementById("formRecebimento");

  if (formRecebimento) {
    formRecebimento.reset();
  }

  await carregarEnviosPendentesNoFormulario();
  preencherResponsavelRecebimento();

  document
    .getElementById("formRecebimentoContainer")
    .classList.remove("hidden");

  document.getElementById("formRecebimentoOverlay").classList.remove("hidden");
}

function fecharFormularioRecebimento() {
  document.getElementById("formRecebimentoContainer").classList.add("hidden");
  document.getElementById("formRecebimentoOverlay").classList.add("hidden");
}

async function salvarRecebimento(event) {
  event.preventDefault();

  const usuario = obterUsuarioAtualRecebimento();

  if (!usuario || !usuario.id) {
    mostrarAlerta("Usuário não autenticado.", true);
    return;
  }

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

  if (Number.isNaN(quantidadeRecebida) || quantidadeRecebida <= 0) {
    mostrarAlerta("Informe uma quantidade válida.");
    return;
  }

  const envioSelecionado = enviosCarregados.find(function (envio) {
    return Number(envio.id) === Number(envioId);
  });

  if (!envioSelecionado) {
    mostrarAlerta("Envio não encontrado.", true);
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
    observacao,

    // Principal para o backend
    usuarioId: usuario.id,

    // Compatibilidade com nomes alternativos
    usuarioRecebimentoId: usuario.id,
    usuarioResponsavelId: usuario.id,
  };

  try {
    console.log("Recebimento enviado para API:", novoRecebimento);

    await confirmarRecebimentoApi(novoRecebimento);

    await carregarCardsRecebimentos();
    await carregarTabelaRecebimentos();
    await detectarAnomalias();

    fecharFormularioRecebimento();

    mostrarAlerta("Recebimento confirmado e estoque atualizado com sucesso.");
  } catch (erro) {
    console.error("Erro ao confirmar recebimento:", erro);
    mostrarAlerta(erro.message, true);
  }
}

async function atualizarSininhoRecebimentos() {
  try {
    const envios = await buscarEnviosApi();

    enviosCarregados = envios;

    const enviosPendentes = envios.filter(function (envio) {
      return envio.status === "PENDENTE";
    }).length;

    const contador = document.getElementById("contadorEnviosPendentes");
    const botaoSininho = document.querySelector(".notification-button");

    if (!contador || !botaoSininho) {
      return;
    }

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

    if (!banner || !mensagem) {
      return;
    }

    const recebimentosPorLoja = {};

    recebimentos.forEach(function (recebimento) {
      if (!recebimentosPorLoja[recebimento.codigoLoja]) {
        recebimentosPorLoja[recebimento.codigoLoja] = {
          nomeLoja: recebimento.nomeLoja,
          total: 0,
        };
      }

      recebimentosPorLoja[recebimento.codigoLoja].total += Number(
        recebimento.quantidadeRecebida || 0,
      );
    });

    const valores = Object.values(recebimentosPorLoja).map(function (item) {
      return item.total;
    });

    if (valores.length < 2) {
      banner.classList.add("hidden");
      return;
    }

    const media =
      valores.reduce(function (a, b) {
        return a + b;
      }, 0) / valores.length;

    const anomalias = Object.values(recebimentosPorLoja)
      .filter(function (item) {
        return item.total > media * 1.5;
      })
      .map(function (item) {
        return item.nomeLoja;
      });

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
  const usuario = carregarUsuarioLogado();

  if (!usuario) {
    return;
  }

  const selectEnvioRecebimento = document.getElementById("envioRecebimento");

  if (selectEnvioRecebimento) {
    selectEnvioRecebimento.addEventListener(
      "change",
      preencherQuantidadeDoEnvioSelecionado,
    );
  }

  const formRecebimento = document.getElementById("formRecebimento");

  if (formRecebimento) {
    formRecebimento.addEventListener("submit", salvarRecebimento);
  }

  await carregarCardsRecebimentos();
  await carregarTabelaRecebimentos();
  await atualizarSininhoRecebimentos();
  await detectarAnomalias();

  if (typeof aplicarPermissoesMenu === "function") {
    aplicarPermissoesMenu();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarPaginaRecebimentos();
});
