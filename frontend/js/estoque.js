let estoquesCarregados = [];

async function buscarEstoquesApi() {
  const resposta = await fetch("http://localhost:3000/api/estoques");

  if (!resposta.ok) {
    throw new Error("Erro ao buscar estoques no backend.");
  }

  return await resposta.json();
}

function obterReposicaoSugerida(estoque) {
  const estoqueAtual = Number(estoque.estoqueAtual);
  const estoqueRecomendado = Number(estoque.estoqueRecomendado);

  if (estoqueAtual >= estoqueRecomendado) {
    return 0;
  }

  return estoqueRecomendado - estoqueAtual;
}

function obterClasseStatusEstoque(status) {
  if (status === "Crítico") return "badge-critico";
  if (status === "Atenção") return "badge-atencao";
  return "badge-normal";
}

function atualizarTexto(ids, valor) {
  ids.forEach(function (id) {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.textContent = valor;
    }
  });
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "-";

  const data = new Date(dataHora);

  if (isNaN(data.getTime())) {
    return dataHora;
  }

  return data.toLocaleString("pt-BR");
}

function mostrarMensagem(mensagem) {
  if (typeof mostrarToast === "function") {
    mostrarToast(mensagem);
    return;
  }

  alert(mensagem);
}

async function carregarCardsEstoque() {
  try {
    const estoques = await buscarEstoquesApi();
    estoquesCarregados = estoques;

    const totalEstoque = estoques.reduce(
      (total, estoque) => total + Number(estoque.estoqueAtual),
      0,
    );

    const lojasCriticas = estoques.filter(
      (estoque) => estoque.statusEstoque === "Crítico",
    ).length;

    const lojasAtencao = estoques.filter(
      (estoque) => estoque.statusEstoque === "Atenção",
    ).length;

    const reposicaoSugerida = estoques.reduce(
      (total, estoque) => total + obterReposicaoSugerida(estoque),
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
  } catch (erro) {
    console.error("Erro ao carregar cards de estoque:", erro);
    mostrarMensagem("Não foi possível carregar os indicadores de estoque.");
  }
}

async function carregarTabelaEstoque() {
  const tabela = document.getElementById("tabelaEstoque");

  if (!tabela) {
    console.error("Elemento tabelaEstoque não encontrado no HTML.");
    return;
  }

  try {
    tabela.innerHTML = "";

    const estoques = await buscarEstoquesApi();
    estoquesCarregados = estoques;

    estoques.forEach(function (estoque) {
      const reposicaoSugerida = obterReposicaoSugerida(estoque);
      const classeStatus = obterClasseStatusEstoque(estoque.statusEstoque);

      tabela.innerHTML += `
        <tr>
          <td>${estoque.codigoLoja}</td>
          <td>${estoque.nomeLoja}</td>
          <td>${estoque.estoqueAtual}</td>
          <td>${estoque.estoqueMinimo}</td>
          <td>${estoque.estoqueRecomendado}</td>
          <td>${reposicaoSugerida}</td>
          <td>
            <span class="badge-status ${classeStatus}">
              ${estoque.statusEstoque}
            </span>
          </td>
          <td>${formatarDataHora(estoque.atualizadoEm)}</td>
          <td>
            <button
              class="btn-primary btn-solicitar"
              onclick="solicitarTalao(${estoque.lojaId}, ${reposicaoSugerida}, this)"
              ${reposicaoSugerida === 0 ? "disabled" : ""}
            >
              Solicitar
            </button>
          </td>
        </tr>
      `;
    });

    aplicarResponsividadeTabelas();
  } catch (erro) {
    console.error("Erro ao carregar tabela de estoque:", erro);
    mostrarMensagem("Não foi possível carregar a tabela de estoque.");
  }
}

function solicitarTalao(lojaId, quantidade, botao) {
  const estoque = estoquesCarregados.find(
    (item) => Number(item.lojaId) === Number(lojaId),
  );

  if (!estoque) {
    mostrarMensagem("Loja não encontrada.");
    return;
  }

  if (quantidade <= 0) {
    mostrarMensagem("Esta loja não precisa de reposição no momento.");
    return;
  }

  mostrarMensagem(
    `Reposição sugerida de ${quantidade} talões para a loja ${estoque.codigoLoja} - ${estoque.nomeLoja}.`,
  );

  botao.disabled = true;
  botao.textContent = "Sugerido";
}

async function exibirRanqueamentoPrioridade() {
  try {
    const estoques =
      estoquesCarregados.length > 0
        ? estoquesCarregados
        : await buscarEstoquesApi();

    estoquesCarregados = estoques;

    const banner = document.getElementById("alertaRanqueamento");
    const mensagem = document.getElementById("mensagemRanqueamento");

    if (!banner || !mensagem) return;

    const criticas = estoques
      .filter((estoque) => estoque.statusEstoque === "Crítico")
      .sort((a, b) => obterReposicaoSugerida(b) - obterReposicaoSugerida(a));

    if (criticas.length === 0) {
      banner.classList.add("hidden");
      return;
    }

    const nomes = criticas
      .map((estoque) => `${estoque.codigoLoja} - ${estoque.nomeLoja}`)
      .join(", ");

    mensagem.textContent = `Prioridade de envio sugerida: ${nomes}. Lojas com maior necessidade de reposição.`;

    banner.classList.remove("hidden");
  } catch (erro) {
    console.error("Erro ao exibir ranqueamento:", erro);
  }
}

async function iniciarPaginaEstoque() {
  carregarUsuarioLogado();

  await carregarCardsEstoque();
  await carregarTabelaEstoque();
  await exibirRanqueamentoPrioridade();

  aplicarPermissoesMenu();
}

iniciarPaginaEstoque();
