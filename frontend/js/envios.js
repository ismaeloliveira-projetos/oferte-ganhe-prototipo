let envioSelecionadoId = null;
let enviosCarregados = [];
let lojasCarregadas = [];

async function buscarEnviosApi() {
  return await apiFetch("/api/envios");
}

async function buscarLojasApi() {
  return await apiFetch("/api/lojas");
}

async function buscarEstoquesApi() {
  return await apiFetch("/api/estoques");
}

async function cadastrarEnvioApi(dadosEnvio) {
  return await apiFetch("/api/envios", {
    method: "POST",
    body: JSON.stringify(dadosEnvio),
  });
}

function normalizarLojaEnvio(loja) {
  return {
    id: loja.id ?? loja.lojaId ?? loja.loja_id ?? loja.idLoja ?? loja.id_loja,

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
      "-",
  };
}

function normalizarEnvio(envio) {
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

    quantidadeEnviada:
      envio.quantidadeEnviada ??
      envio.quantidade_enviada ??
      envio.quantidade ??
      0,

    codigoRemessa:
      envio.codigoRemessa ?? envio.codigo_remessa ?? envio.remessa ?? "-",

    usuarioEnvioId:
      envio.usuarioEnvioId ??
      envio.usuario_envio_id ??
      envio.usuarioId ??
      envio.usuario_id,

    usuarioEnvioNome:
      envio.usuarioEnvioNome ??
      envio.usuario_envio_nome ??
      envio.usuarioNome ??
      envio.usuario_nome,

    dataEnvio:
      envio.dataEnvio ??
      envio.data_envio ??
      envio.criadoEm ??
      envio.criado_em ??
      envio.dataHora ??
      envio.data_hora,

    status: envio.status ?? "-",
  };
}

async function buscarLojasParaFormularioApi() {
  let estoques = [];
  let lojas = [];

  try {
    estoques = await buscarEstoquesApi();
  } catch (erro) {
    console.warn("Não foi possível buscar estoques para o formulário:", erro);
  }

  try {
    lojas = await buscarLojasApi();
  } catch (erro) {
    console.warn("Não foi possível buscar lojas para o formulário:", erro);
  }

  const lojasNormalizadasPorEstoque = Array.isArray(estoques)
    ? estoques.map(normalizarLojaEnvio)
    : [];

  const lojasNormalizadas = Array.isArray(lojas)
    ? lojas.map(normalizarLojaEnvio)
    : [];

  const mapaLojas = new Map();

  lojasNormalizadas.forEach(function (loja) {
    if (!loja.id) {
      return;
    }

    mapaLojas.set(Number(loja.id), loja);
  });

  lojasNormalizadasPorEstoque.forEach(function (lojaEstoque) {
    if (!lojaEstoque.id) {
      return;
    }

    const lojaExistente = mapaLojas.get(Number(lojaEstoque.id));

    mapaLojas.set(Number(lojaEstoque.id), {
      id: lojaEstoque.id,
      codigoLoja:
        lojaEstoque.codigoLoja !== "-"
          ? lojaEstoque.codigoLoja
          : lojaExistente?.codigoLoja || "-",
      nomeLoja:
        lojaEstoque.nomeLoja !== "-"
          ? lojaEstoque.nomeLoja
          : lojaExistente?.nomeLoja || "-",
    });
  });

  return Array.from(mapaLojas.values()).filter(function (loja) {
    return loja.id && loja.codigoLoja !== "-" && loja.nomeLoja !== "-";
  });
}

function obterUsuarioAtualEnvio() {
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

function obterClasseStatusEnvio(status) {
  if (status === "PENDENTE") return "badge-atencao";
  if (status === "RECEBIDO") return "badge-normal";
  if (status === "CANCELADO") return "badge-critico";

  return "badge-normal";
}

function formatarStatusEnvio(status) {
  if (status === "PENDENTE") return "Pendente";
  if (status === "RECEBIDO") return "Recebido";
  if (status === "CANCELADO") return "Cancelado";

  return status || "-";
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "-";

  const data = new Date(dataHora);

  if (Number.isNaN(data.getTime())) {
    return dataHora;
  }

  return data.toLocaleString("pt-BR");
}

async function carregarCardsEnvios() {
  try {
    const resposta = await buscarEnviosApi();

    const envios = Array.isArray(resposta) ? resposta.map(normalizarEnvio) : [];

    enviosCarregados = envios;

    const totalEnvios = envios.length;

    const totalTaloesEnviados = envios.reduce(function (total, envio) {
      return total + Number(envio.quantidadeEnviada || 0);
    }, 0);

    const enviosPendentes = envios.filter(function (envio) {
      return envio.status === "PENDENTE";
    }).length;

    const lojasAtendidas = new Set(
      envios.map(function (envio) {
        return envio.codigoLoja;
      }),
    ).size;

    document.getElementById("totalEnvios").textContent = totalEnvios;
    document.getElementById("totalTaloesEnviados").textContent =
      totalTaloesEnviados;
    document.getElementById("enviosPendentes").textContent = enviosPendentes;
    document.getElementById("lojasAtendidas").textContent = lojasAtendidas;
  } catch (erro) {
    console.error("Erro ao carregar cards de envios:", erro);
    mostrarAlerta("Não foi possível carregar os indicadores de envios.", true);
  }
}

async function carregarTabelaEnvios() {
  const tabela = document.getElementById("tabelaEnvios");

  if (!tabela) {
    return;
  }

  try {
    tabela.innerHTML = "";

    const resposta = await buscarEnviosApi();

    const envios = Array.isArray(resposta) ? resposta.map(normalizarEnvio) : [];

    enviosCarregados = envios;

    if (envios.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            Nenhum envio encontrado para o seu usuário.
          </td>
        </tr>
      `;
      return;
    }

    envios.forEach(function (envio) {
      const classeStatus = obterClasseStatusEnvio(envio.status);

      tabela.innerHTML += `
        <tr>
          <td>${formatarDataHora(envio.dataEnvio)}</td>
          <td>${envio.codigoLoja} - ${envio.nomeLoja}</td>
          <td>${envio.quantidadeEnviada}</td>
          <td>${envio.usuarioEnvioNome || envio.usuarioEnvioId || "Não informado"}</td>
          <td>
            <span class="badge-status ${classeStatus}">
              ${formatarStatusEnvio(envio.status)}
            </span>
          </td>
          <td>
            <button
              class="btn-table-action btn-sm"
              onclick="verDetalhesEnvio(${envio.id})"
            >
              Ver Detalhes
            </button>
          </td>
        </tr>
      `;
    });

    if (typeof aplicarResponsividadeTabelas === "function") {
      aplicarResponsividadeTabelas();
    }
  } catch (erro) {
    console.error("Erro ao carregar envios:", erro);
    mostrarAlerta("Não foi possível carregar os envios.", true);
  }
}

function verDetalhesEnvio(id) {
  const envio = enviosCarregados.find(function (item) {
    return Number(item.id) === Number(id);
  });

  if (!envio) {
    mostrarAlerta("Envio não encontrado.", true);
    return;
  }

  envioSelecionadoId = id;

  const classeStatus = obterClasseStatusEnvio(envio.status);
  const conteudo = document.getElementById("detalhesEnvioConteudo");

  if (!conteudo) {
    return;
  }

  conteudo.innerHTML = `
    <div class="detail-row">
      <strong>ID do Envio</strong>
      <span>${envio.id}</span>
    </div>

    <div class="detail-row">
      <strong>Data/Hora</strong>
      <span>${formatarDataHora(envio.dataEnvio)}</span>
    </div>

    <div class="detail-row">
      <strong>Loja</strong>
      <span>${envio.codigoLoja} - ${envio.nomeLoja}</span>
    </div>

    <div class="detail-row">
      <strong>Quantidade de Talões</strong>
      <span>${envio.quantidadeEnviada}</span>
    </div>

    <div class="detail-row">
      <strong>Código da Remessa</strong>
      <span>${envio.codigoRemessa}</span>
    </div>

    <div class="detail-row">
      <strong>Responsável</strong>
      <span>${envio.usuarioEnvioNome || envio.usuarioEnvioId || "Não informado"}</span>
    </div>

    <div class="detail-row">
      <strong>Status</strong>
      <span class="badge-status ${classeStatus}">
        ${formatarStatusEnvio(envio.status)}
      </span>
    </div>
  `;

  document.getElementById("detalhesEnvioContainer").classList.remove("hidden");
  document.getElementById("detalhesEnvioOverlay").classList.remove("hidden");
}

function fecharDetalhesEnvio() {
  document.getElementById("detalhesEnvioContainer").classList.add("hidden");
  document.getElementById("detalhesEnvioOverlay").classList.add("hidden");
}

async function carregarLojasNoFormulario() {
  const selectLoja = document.getElementById("lojaEnvio");

  if (!selectLoja) {
    return;
  }

  try {
    const lojas = await buscarLojasParaFormularioApi();

    lojasCarregadas = lojas;

    selectLoja.innerHTML = `
      <option value="">Selecione uma loja</option>
    `;

    if (lojas.length === 0) {
      selectLoja.innerHTML = `
        <option value="">Nenhuma loja disponível</option>
      `;
      return;
    }

    lojas.forEach(function (loja) {
      selectLoja.innerHTML += `
        <option value="${loja.id}">
          ${loja.codigoLoja} - ${loja.nomeLoja}
        </option>
      `;
    });
  } catch (erro) {
    console.error("Erro ao carregar lojas no formulário:", erro);
    mostrarAlerta("Não foi possível carregar as lojas.", true);
  }
}

async function abrirFormularioEnvio() {
  const formEnvio = document.getElementById("formEnvio");

  if (formEnvio) {
    formEnvio.reset();
  }

  await carregarLojasNoFormulario();
  preencherResponsavelEnvio();

  document.getElementById("formEnvioContainer").classList.remove("hidden");
  document.getElementById("formEnvioOverlay").classList.remove("hidden");
}

function fecharFormularioEnvio() {
  document.getElementById("formEnvioContainer").classList.add("hidden");
  document.getElementById("formEnvioOverlay").classList.add("hidden");
}

function preencherResponsavelEnvio() {
  const usuario = obterUsuarioAtualEnvio();
  const inputResponsavel = document.getElementById("responsavelEnvio");

  if (inputResponsavel) {
    inputResponsavel.value = usuario?.nome || "Usuário";
  }
}

async function salvarEnvio(event) {
  event.preventDefault();

  const usuario = obterUsuarioAtualEnvio();

  if (!usuario || !usuario.id) {
    mostrarAlerta("Usuário não autenticado.", true);
    return;
  }

  const lojaIdValor = document.getElementById("lojaEnvio").value;
  const lojaId = Number(lojaIdValor);

  const quantidadeEnviada = Number(
    document.getElementById("quantidadeEnvio").value,
  );

  const codigoRemessa = document.getElementById("remessaEnvio").value.trim();

  if (!lojaIdValor || Number.isNaN(lojaId)) {
    mostrarAlerta("Selecione uma loja para o envio.");
    return;
  }

  if (Number.isNaN(quantidadeEnviada) || quantidadeEnviada <= 0) {
    mostrarAlerta("Informe uma quantidade válida.");
    return;
  }

  if (!codigoRemessa) {
    mostrarAlerta("Informe o código da remessa.");
    return;
  }

  const novoEnvio = {
    codigoRemessa,
    lojaId,
    usuarioEnvioId: usuario.id,
    quantidadeEnviada,
  };

  try {
    await cadastrarEnvioApi(novoEnvio);

    await carregarCardsEnvios();
    await carregarTabelaEnvios();

    fecharFormularioEnvio();

    mostrarAlerta("Envio registrado com sucesso no banco de dados.");
  } catch (erro) {
    console.error("Erro ao cadastrar envio:", erro);
    mostrarAlerta(erro.message, true);
  }
}

async function iniciarPaginaEnvios() {
  const usuario = carregarUsuarioLogado();

  if (!usuario) {
    return;
  }

  const formEnvio = document.getElementById("formEnvio");

  if (formEnvio) {
    formEnvio.addEventListener("submit", salvarEnvio);
  }

  await carregarCardsEnvios();
  await carregarTabelaEnvios();

  if (typeof aplicarPermissoesMenu === "function") {
    aplicarPermissoesMenu();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarPaginaEnvios();
});
