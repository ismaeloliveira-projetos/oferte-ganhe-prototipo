let envioSelecionadoId = null;

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
  if (status === "Pendente") return "badge-atencao";
  if (status === "Recebido") return "badge-normal";
  if (status === "Cancelado") return "badge-critico";
  return "badge-normal";
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "-";
  const data = new Date(dataHora);
  if (isNaN(data.getTime())) return dataHora;
  return data.toLocaleString("pt-BR");
}

function carregarCardsEnvios() {
  const envios = buscarEnviosSalvos();
  const totalEnvios = envios.length;
  const totalTaloesEnviados = envios.reduce(
    (total, envio) => total + Number(envio.quantidade),
    0,
  );
  const enviosPendentes = envios.filter(
    (envio) => envio.status === "Pendente",
  ).length;
  const lojasAtendidas = new Set(envios.map((envio) => envio.codigoLoja)).size;

  document.getElementById("totalEnvios").textContent = totalEnvios;
  document.getElementById("totalTaloesEnviados").textContent =
    totalTaloesEnviados;
  document.getElementById("enviosPendentes").textContent = enviosPendentes;
  document.getElementById("lojasAtendidas").textContent = lojasAtendidas;
}

function carregarTabelaEnvios() {
  const tabela = document.getElementById("tabelaEnvios");
  tabela.innerHTML = "";
  const envios = buscarEnviosSalvos();

  envios.forEach(function (envio) {
    const loja = buscarLojaPorCodigo(envio.codigoLoja);
    const classeStatus = obterClasseStatusEnvio(envio.status);

    tabela.innerHTML += `
      <tr>
        <td>${formatarDataHora(envio.dataHora)}</td>
        <td>${loja ? loja.nome : "Loja desconhecida"}</td>
        <td>${envio.quantidade}</td>
        <td>${envio.responsavel}</td>
        <td><span class="badge-status ${classeStatus}">${envio.status}</span></td>
        <td><button class="btn-table-action btn-sm" onclick="verDetalhesEnvio(${envio.id})">Ver Detalhes</button></td>
      </tr>
    `;
  });

  aplicarResponsividadeTabelas();
}

function verDetalhesEnvio(id) {
  const envios = buscarTodosEnvios();
  const envio = envios.find((e) => e.id === id);

  if (!envio) {
    mostrarAlerta("Envio não encontrado.");
    return;
  }

  const loja = buscarLojaPorCodigo(envio.codigoLoja);
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
      <span>${formatarDataHora(envio.dataHora)}</span>
    </div>
    <div class="detail-row">
      <strong>Loja</strong>
      <span>${loja ? loja.nome : "Loja desconhecida"} (${envio.codigoLoja})</span>
    </div>
    <div class="detail-row">
      <strong>Quantidade de Talões</strong>
      <span>${envio.quantidade}</span>
    </div>
    <div class="detail-row">
      <strong>Código da Remessa</strong>
      <span>${envio.remessa}</span>
    </div>
    <div class="detail-row">
      <strong>Responsável</strong>
      <span>${envio.responsavel}</span>
    </div>
    <div class="detail-row">
      <strong>Status</strong>
      <span class="badge ${classeStatus}">${status}</span>
    </div>
  `;

  document.getElementById("detalhesEnvioContainer").classList.remove("hidden");
  document.getElementById("detalhesEnvioOverlay").classList.remove("hidden");
}

function fecharDetalhesEnvio() {
  document.getElementById("detalhesEnvioContainer").classList.add("hidden");
  document.getElementById("detalhesEnvioOverlay").classList.add("hidden");
}

function carregarLojasNoFormulario() {
  const selectLoja = document.getElementById("lojaEnvio");
  const lojas = buscarLojasSalvas();
  selectLoja.innerHTML = "";

  if (lojas.length === 0) {
    selectLoja.innerHTML = `<option value="">Nenhuma loja cadastrada</option>`;
    return;
  }

  lojas.forEach((loja) => {
    selectLoja.innerHTML += `<option value="${loja.codigo}">${loja.codigo} - ${loja.nome}</option>`;
  });
}

function abrirFormularioEnvio() {
  document.getElementById("formEnvio").reset();
  carregarLojasNoFormulario();
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

document
  .getElementById("formEnvio")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const codigoLoja = document.getElementById("lojaEnvio").value;
    const quantidade = Number(document.getElementById("quantidadeEnvio").value);
    const remessa = document.getElementById("remessaEnvio").value;
    const inputResponsavel = document.getElementById("responsavelEnvio");
    const responsavel =
      inputResponsavel && inputResponsavel.value
        ? inputResponsavel.value
        : obterUsuarioLogado().nome;

    if (!codigoLoja) {
      mostrarAlerta("Selecione uma loja para o envio.");
      return;
    }
    if (quantidade <= 0) {
      mostrarAlerta("Informe uma quantidade válida.");
      return;
    }
    if (!remessa) {
      mostrarAlerta("Informe o código da remessa.");
      return;
    }

    const envios = buscarTodosEnvios();

    const novoEnvio = {
      id: Date.now(),
      dataHora: new Date().toISOString(),
      codigoLoja: codigoLoja,
      quantidade: quantidade,
      remessa: remessa,
      responsavel: responsavel,
      status: "Pendente",
    };

    envios.push(novoEnvio);
    salvarEnvios(envios);

    carregarCardsEnvios();
    carregarTabelaEnvios();
    fecharFormularioEnvio();
    mostrarAlerta("Envio registrado com sucesso.");
  });

carregarUsuarioLogado();
carregarCardsEnvios();
carregarTabelaEnvios();
aplicarPermissoesMenu();
