let estoquesCarregados = [];

async function buscarEstoquesApi() {
  const resposta = await fetch("http://localhost:3000/api/estoques");

  if (!resposta.ok) {
    throw new Error("Erro ao buscar estoques no backend.");
  }

  return await resposta.json();
}

// Função para buscar o histórico de movimentações de estoque de uma loja específica
async function buscarMovimentacoesEstoqueApi(lojaId) {
  const resposta = await fetch(
    `http://localhost:3000/api/movimentacoes-estoque?lojaId=${lojaId}`,
  );

  if (!resposta.ok) {
    throw new Error("Erro ao buscar histórico de movimentações.");
  }

  return await resposta.json();
}

function formatarTipoMovimentacao(tipo) {
  if (tipo === "RECEBIMENTO") return "Recebimento";
  if (tipo === "MANUTENCAO_ENTRADA") return "Manutenção Entrada";
  if (tipo === "MANUTENCAO_SAIDA") return "Manutenção Saída";
  if (tipo === "AVARIA") return "Avaria";
  if (tipo === "EXTRAVIO") return "Extravio";
  if (tipo === "CORRECAO") return "Correção";

  return tipo;
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
  <div class="table-actions estoque-actions">
    <button
      class="btn-primary btn-solicitar"
      onclick="solicitarTalao(${estoque.lojaId}, ${reposicaoSugerida}, this)"
      ${reposicaoSugerida === 0 ? "disabled" : ""}
    >
      Solicitar
    </button>

    <button
      class="btn-table-action btn-sm"
      onclick="verHistoricoEstoque(${estoque.lojaId})"
    >
      Histórico
    </button>
  </div>
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

async function verHistoricoEstoque(lojaId) {
  const conteudo = document.getElementById("historicoEstoqueConteudo");

  if (!conteudo) {
    mostrarMensagem("Área de histórico não encontrada no HTML.");
    return;
  }

  try {
    const movimentacoes = await buscarMovimentacoesEstoqueApi(lojaId);

    if (movimentacoes.length === 0) {
      conteudo.innerHTML = `
        <p class="empty-state">
          Nenhuma movimentação encontrada para esta loja.
        </p>
      `;
    } else {
      conteudo.innerHTML = "";

      movimentacoes.forEach((movimentacao) => {
        conteudo.innerHTML += `
          <div class="detail-card">
            <div class="detail-row">
              <strong>Data</strong>
              <span>${formatarDataHora(movimentacao.criadoEm)}</span>
            </div>

            <div class="detail-row">
              <strong>Tipo</strong>
              <span>${formatarTipoMovimentacao(movimentacao.tipoMovimentacao)}</span>
            </div>

            <div class="detail-row">
              <strong>Quantidade</strong>
              <span>${movimentacao.quantidade}</span>
            </div>

            <div class="detail-row">
              <strong>Saldo anterior</strong>
              <span>${movimentacao.saldoAnterior}</span>
            </div>

            <div class="detail-row">
              <strong>Saldo posterior</strong>
              <span>${movimentacao.saldoPosterior}</span>
            </div>

            <div class="detail-row">
              <strong>Remessa</strong>
              <span>${movimentacao.codigoRemessa || "-"}</span>
            </div>

            <div class="detail-row">
              <strong>Observação</strong>
              <span>${movimentacao.observacao || "-"}</span>
            </div>
          </div>
        `;
      });
    }

    document
      .getElementById("historicoEstoqueContainer")
      .classList.remove("hidden");

    document
      .getElementById("historicoEstoqueOverlay")
      .classList.remove("hidden");
  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);
    mostrarMensagem("Não foi possível carregar o histórico de estoque.");
  }
}

function fecharHistoricoEstoque() {
  document.getElementById("historicoEstoqueContainer").classList.add("hidden");

  document.getElementById("historicoEstoqueOverlay").classList.add("hidden");
}

iniciarPaginaEstoque();
