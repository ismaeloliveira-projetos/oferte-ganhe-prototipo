let envioSelecionadoId = null;
let enviosCarregados = [];
let lojasCarregadas = [];

async function buscarEnviosApi() {
  const resposta = await fetch("http://localhost:3000/api/envios");

  if (!resposta.ok) {
    throw new Error("Erro ao buscar envios no backend.");
  }

  return await resposta.json();
}

async function buscarLojasApi() {
  const resposta = await fetch("http://localhost:3000/api/lojas");

  if (!resposta.ok) {
    throw new Error("Erro ao buscar lojas no backend.");
  }

  return await resposta.json();
}

async function cadastrarEnvioApi(novoEnvio) {
  const resposta = await fetch("http://localhost:3000/api/envios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(novoEnvio),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao cadastrar envio.");
  }

  return dados;
}

function buscarTodosEnvios() {
  const banco = carregarBanco();
  if (!banco.envios) {
    banco.envios = [];
    salvarBanco(banco);
  }
  return banco.envios;
}

function buscarEnviosSalvos() {
  return filtrarPorLoja(
    buscarTodosEnvios(),
    buscarUsuarioLogado(),
    "codigoLoja",
  );
}

function buscarLojasSalvas() {
  const banco = carregarBanco();
  if (!banco.lojas) {
    banco.lojas = [];
    salvarBanco(banco);
  }
  return filtrarPorLoja(banco.lojas, buscarUsuarioLogado(), "codigo");
}

function salvarEnvios(envios) {
  const banco = carregarBanco();
  banco.envios = envios;
  salvarBanco(banco);
}

function mostrarAlerta(mensagem) {
  const alerta = document.getElementById("alertaSistema");
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

function buscarLojaPorCodigo(codigoLoja) {
  const lojas = buscarLojasSalvas();
  return lojas.find((loja) => loja.codigo === codigoLoja);
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
  return status;
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "-";
  const data = new Date(dataHora);
  if (isNaN(data.getTime())) return dataHora;
  return data.toLocaleString("pt-BR");
}

async function carregarCardsEnvios() {
  try {
    const envios = await buscarEnviosApi();
    enviosCarregados = envios;

    const totalEnvios = envios.length;

    const totalTaloesEnviados = envios.reduce(
      (total, envio) => total + Number(envio.quantidadeEnviada),
      0,
    );

    const enviosPendentes = envios.filter(
      (envio) => envio.status === "PENDENTE",
    ).length;

    const lojasAtendidas = new Set(envios.map((envio) => envio.codigoLoja))
      .size;

    document.getElementById("totalEnvios").textContent = totalEnvios;
    document.getElementById("totalTaloesEnviados").textContent =
      totalTaloesEnviados;
    document.getElementById("enviosPendentes").textContent = enviosPendentes;
    document.getElementById("lojasAtendidas").textContent = lojasAtendidas;
  } catch (erro) {
    console.error("Erro ao carregar cards de envios:", erro);
    mostrarAlerta("Não foi possível carregar os indicadores de envios.");
  }
}

async function carregarTabelaEnvios() {
  const tabela = document.getElementById("tabelaEnvios");

  if (!tabela) return;

  try {
    tabela.innerHTML = "";

    const envios = await buscarEnviosApi();
    enviosCarregados = envios;

    envios.forEach(function (envio) {
      const classeStatus = obterClasseStatusEnvio(envio.status);

      tabela.innerHTML += `
        <tr>
          <td>${formatarDataHora(envio.dataEnvio)}</td>
          <td>${envio.codigoLoja} - ${envio.nomeLoja}</td>
          <td>${envio.quantidadeEnviada}</td>
          <td>${envio.usuarioEnvioId || "Não informado"}</td>
          <td><span class="badge-status ${classeStatus}">${formatarStatusEnvio(envio.status)}</span></td>
          <td>
            <button class="btn-table-action btn-sm" onclick="verDetalhesEnvio(${envio.id})">
              Ver Detalhes
            </button>
          </td>
        </tr>
      `;
    });

    aplicarResponsividadeTabelas();
  } catch (erro) {
    console.error("Erro ao carregar envios:", erro);
    mostrarAlerta("Não foi possível carregar os envios.");
  }
}

function verDetalhesEnvio(id) {
  const envio = enviosCarregados.find((e) => e.id === id);

  if (!envio) {
    mostrarAlerta("Envio não encontrado.");
    return;
  }

  const status = envio.status;
  const classeStatus = obterClasseStatusEnvio(status);

  const conteudo = document.getElementById("detalhesEnvioConteudo");

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
      <span>${envio.usuarioEnvioId || "Não informado"}</span>
    </div>

    <div class="detail-row">
      <strong>Status</strong>
      <span class="badge ${classeStatus}">${formatarStatusEnvio(status)}</span>
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

  if (!selectLoja) return;

  try {
    const lojas = await buscarLojasApi();
    lojasCarregadas = lojas;

    selectLoja.innerHTML = "";

    if (lojas.length === 0) {
      selectLoja.innerHTML = `<option value="">Nenhuma loja cadastrada</option>`;
      return;
    }

    lojas.forEach((loja) => {
      selectLoja.innerHTML += `
        <option value="${loja.id}">
          ${loja.codigo} - ${loja.nome}
        </option>
      `;
    });
  } catch (erro) {
    console.error("Erro ao carregar lojas no formulário:", erro);
    mostrarAlerta("Não foi possível carregar as lojas.");
  }
}

async function abrirFormularioEnvio() {
  document.getElementById("formEnvio").reset();

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
  const usuario = obterUsuarioLogado();
  const inputResponsavel = document.getElementById("responsavelEnvio");
  if (inputResponsavel) inputResponsavel.value = usuario.nome;
}

const formEnvio = document.getElementById("formEnvio");

if (formEnvio) {
  formEnvio.addEventListener("submit", async function (event) {
    event.preventDefault();

    const lojaId = Number(document.getElementById("lojaEnvio").value);
    const quantidadeEnviada = Number(
      document.getElementById("quantidadeEnvio").value,
    );
    const codigoRemessa = document.getElementById("remessaEnvio").value.trim();

    if (!lojaId) {
      mostrarAlerta("Selecione uma loja para o envio.");
      return;
    }

    if (quantidadeEnviada <= 0) {
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
      usuarioEnvioId: null,
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
      mostrarAlerta(erro.message);
    }
  });
}

carregarUsuarioLogado();
carregarCardsEnvios();
carregarTabelaEnvios();
aplicarPermissoesMenu();
