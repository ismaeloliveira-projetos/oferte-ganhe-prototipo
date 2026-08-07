let estoquesCarregados = [];

async function buscarEstoquesApi() {
  const estoques = await apiFetch("/api/estoques");

  if (!Array.isArray(estoques)) {
    return [];
  }

  return estoques.map(normalizarEstoque);
}

async function buscarMovimentacoesEstoqueApi(lojaId) {
  const parametroLoja = lojaId ? `?lojaId=${lojaId}` : "";

  const movimentacoes = await apiFetch(
    `/api/estoques/movimentacoes-estoque${parametroLoja}`,
  );

  if (!Array.isArray(movimentacoes)) {
    return [];
  }

  return movimentacoes.map(normalizarMovimentacaoEstoque);
}

function normalizarEstoque(estoque) {
  const lojaId =
    estoque.lojaId ??
    estoque.loja_id ??
    estoque.idLoja ??
    estoque.id_loja ??
    estoque.id;

  const estoqueAtual = Number(
    estoque.estoqueAtual ??
      estoque.estoque_atual ??
      estoque.quantidadeAtual ??
      estoque.quantidade_atual ??
      estoque.saldoAtual ??
      0,
  );

  const estoqueMinimo = Number(
    estoque.estoqueMinimo ??
      estoque.estoque_minimo ??
      estoque.quantidadeMinima ??
      estoque.quantidade_minima ??
      estoque.minimo ??
      0,
  );

  const estoqueRecomendado = Number(
    estoque.estoqueRecomendado ??
      estoque.estoque_recomendado ??
      estoque.quantidadeRecomendada ??
      estoque.quantidade_recomendada ??
      estoque.recomendado ??
      0,
  );

  const codigoLoja =
    estoque.codigoLoja ??
    estoque.codigo_loja ??
    estoque.codigo ??
    estoque.lojaCodigo ??
    estoque.loja_codigo ??
    "-";

  const nomeLoja =
    estoque.nomeLoja ??
    estoque.nome_loja ??
    estoque.nome ??
    estoque.lojaNome ??
    estoque.loja_nome ??
    "-";

  const statusEstoque =
    estoque.statusEstoque ??
    estoque.status_estoque ??
    estoque.status ??
    calcularStatusEstoque(estoqueAtual, estoqueMinimo, estoqueRecomendado);

  return {
    lojaId,
    codigoLoja,
    nomeLoja,
    estoqueAtual,
    estoqueMinimo,
    estoqueRecomendado,
    statusEstoque,
    atualizadoEm:
      estoque.atualizadoEm ??
      estoque.atualizado_em ??
      estoque.criadoEm ??
      estoque.criado_em ??
      null,
  };
}

function normalizarMovimentacaoEstoque(movimentacao) {
  return {
    id: movimentacao.id,
    lojaId:
      movimentacao.lojaId ??
      movimentacao.loja_id ??
      movimentacao.idLoja ??
      movimentacao.id_loja,
    criadoEm:
      movimentacao.criadoEm ??
      movimentacao.criado_em ??
      movimentacao.dataHora ??
      movimentacao.data_hora,
    tipoMovimentacao:
      movimentacao.tipoMovimentacao ??
      movimentacao.tipo_movimentacao ??
      movimentacao.tipo,
    quantidade: movimentacao.quantidade ?? 0,
    saldoAnterior:
      movimentacao.saldoAnterior ??
      movimentacao.saldo_anterior ??
      movimentacao.estoqueAnterior ??
      "-",
    saldoPosterior:
      movimentacao.saldoPosterior ??
      movimentacao.saldo_posterior ??
      movimentacao.estoquePosterior ??
      movimentacao.estoqueAtualizado ??
      "-",
    codigoRemessa:
      movimentacao.codigoRemessa ??
      movimentacao.codigo_remessa ??
      movimentacao.remessa ??
      "-",
    observacao: movimentacao.observacao ?? "-",
  };
}

function calcularStatusEstoque(
  estoqueAtual,
  estoqueMinimo,
  estoqueRecomendado,
) {
  if (estoqueAtual <= estoqueMinimo) {
    return "Crítico";
  }

  if (estoqueAtual < estoqueRecomendado) {
    return "Atenção";
  }

  return "Normal";
}

function carregarUsuarioPaginaEstoque() {
  const usuarioLogado =
    typeof buscarUsuarioLogado === "function"
      ? buscarUsuarioLogado()
      : obterUsuarioLogado();

  if (!usuarioLogado || !usuarioLogado.id) {
    window.location.href = "login.html";
    return null;
  }

  const nomeUsuario = document.getElementById("nomeUsuario");

  if (nomeUsuario) {
    nomeUsuario.textContent = usuarioLogado.nome || "Usuário";
  }

  return usuarioLogado;
}

function formatarTipoMovimentacao(tipo) {
  if (tipo === "RECEBIMENTO") return "Recebimento";
  if (tipo === "MANUTENCAO_ENTRADA") return "Manutenção Entrada";
  if (tipo === "MANUTENCAO_SAIDA") return "Manutenção Saída";
  if (tipo === "AVARIA") return "Avaria";
  if (tipo === "EXTRAVIO") return "Extravio";
  if (tipo === "CORRECAO") return "Correção";
  if (tipo === "AJUSTE_ENTRADA") return "Ajuste de Entrada";
  if (tipo === "AJUSTE_SAIDA") return "Ajuste de Saída";

  return tipo || "-";
}

function obterReposicaoSugerida(estoque) {
  const estoqueAtual = Number(estoque.estoqueAtual || 0);
  const estoqueRecomendado = Number(estoque.estoqueRecomendado || 0);

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

  if (Number.isNaN(data.getTime())) {
    return dataHora;
  }

  return data.toLocaleString("pt-BR");
}

function mostrarMensagem(mensagem, erro = false) {
  if (typeof mostrarToast === "function") {
    mostrarToast(mensagem, erro);
    return;
  }

  alert(mensagem);
}

async function carregarCardsEstoque() {
  try {
    const estoques = await buscarEstoquesApi();
    estoquesCarregados = estoques;

    const totalEstoque = estoques.reduce(function (total, estoque) {
      return total + Number(estoque.estoqueAtual || 0);
    }, 0);

    const lojasCriticas = estoques.filter(function (estoque) {
      return estoque.statusEstoque === "Crítico";
    }).length;

    const lojasAtencao = estoques.filter(function (estoque) {
      return estoque.statusEstoque === "Atenção";
    }).length;

    const reposicaoSugerida = estoques.reduce(function (total, estoque) {
      return total + obterReposicaoSugerida(estoque);
    }, 0);

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
    mostrarMensagem(
      "Não foi possível carregar os indicadores de estoque.",
      true,
    );
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

    if (estoques.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            Nenhum estoque encontrado para o seu usuário.
          </td>
        </tr>
      `;
      return;
    }

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

    if (typeof aplicarResponsividadeTabelas === "function") {
      aplicarResponsividadeTabelas();
    }
  } catch (erro) {
    console.error("Erro ao carregar tabela de estoque:", erro);
    mostrarMensagem("Não foi possível carregar a tabela de estoque.", true);
  }
}

function solicitarTalao(lojaId, quantidade, botao) {
  const estoque = estoquesCarregados.find(function (item) {
    return Number(item.lojaId) === Number(lojaId);
  });

  if (!estoque) {
    mostrarMensagem("Loja não encontrada.", true);
    return;
  }

  if (quantidade <= 0) {
    mostrarMensagem("Esta loja não precisa de reposição no momento.");
    return;
  }

  mostrarMensagem(
    `Reposição sugerida de ${quantidade} talões para a loja ${estoque.codigoLoja} - ${estoque.nomeLoja}.`,
  );

  if (botao) {
    botao.disabled = true;
    botao.textContent = "Sugerido";
  }
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

    if (!banner || !mensagem) {
      return;
    }

    const criticasOrdenadas = estoques
      .filter(function (estoque) {
        return estoque.statusEstoque === "Crítico";
      })
      .sort(function (a, b) {
        return obterReposicaoSugerida(b) - obterReposicaoSugerida(a);
      });

    const prioridades = criticasOrdenadas.slice(0, 5);

    if (prioridades.length === 0) {
      banner.classList.add("hidden");
      return;
    }

    const nomes = prioridades
      .map(function (estoque) {
        return `${estoque.codigoLoja} - ${estoque.nomeLoja}`;
      })
      .join(", ");

    const existemMaisLojas = criticasOrdenadas.length > prioridades.length;

    mensagem.textContent =
      `Prioridade de envio sugerida: ${nomes}. ` +
      `Lojas com maior necessidade de reposição.` +
      (existemMaisLojas ? " Exibindo as 5 maiores prioridades." : "");

    banner.classList.remove("hidden");
  } catch (erro) {
    console.error("Erro ao exibir ranqueamento:", erro);
  }
}

async function verHistoricoEstoque(lojaId) {
  const conteudo = document.getElementById("historicoEstoqueConteudo");

  if (!conteudo) {
    mostrarMensagem("Área de histórico não encontrada no HTML.", true);
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

      movimentacoes.forEach(function (movimentacao) {
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
              <span>${movimentacao.codigoRemessa}</span>
            </div>

            <div class="detail-row">
              <strong>Observação</strong>
              <span>${movimentacao.observacao}</span>
            </div>
          </div>
        `;
      });
    }

    const container = document.getElementById("historicoEstoqueContainer");
    const overlay = document.getElementById("historicoEstoqueOverlay");

    if (container) {
      container.classList.remove("hidden");
    }

    if (overlay) {
      overlay.classList.remove("hidden");
    }
  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);
    mostrarMensagem("Não foi possível carregar o histórico de estoque.", true);
  }
}

function fecharHistoricoEstoque() {
  const container = document.getElementById("historicoEstoqueContainer");
  const overlay = document.getElementById("historicoEstoqueOverlay");

  if (container) {
    container.classList.add("hidden");
  }

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

async function iniciarPaginaEstoque() {
  const usuarioLogado = carregarUsuarioPaginaEstoque();

  if (!usuarioLogado) {
    return;
  }

  await carregarCardsEstoque();
  await carregarTabelaEstoque();
  await exibirRanqueamentoPrioridade();

  configurarBotaoAnaliseOperacionalIA(
    "btnGerarAnaliseOperacionalIA",
    "resultadoAnaliseOperacionalIA",
  );

  if (typeof aplicarPermissoesMenu === "function") {
    aplicarPermissoesMenu();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarPaginaEstoque();
});
