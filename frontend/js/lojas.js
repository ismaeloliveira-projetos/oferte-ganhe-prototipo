let codigoLojaEditando = null;
let codigoLojaExcluindo = null;
let lojasCarregadas = [];

async function buscarLojasApi() {
  return await apiFetch("/api/lojas");
}

async function buscarEstoquesApi() {
  return await apiFetch("/api/estoques");
}

async function buscarLojasComEstoqueApi() {
  const lojas = await buscarLojasApi();
  const estoques = await buscarEstoquesApi();

  console.log("LOJAS API:", lojas);
  console.log("ESTOQUES API:", estoques);

  return lojas.map(function (loja) {
    const lojaId = loja.id ?? loja.lojaId ?? loja.idLoja;

    const estoqueEncontrado = estoques.find(function (estoque) {
      return Number(estoque.lojaId) === Number(lojaId);
    });

    const codigoLoja =
      loja.codigoLoja ??
      loja.codigo_loja ??
      loja.codigo ??
      estoqueEncontrado?.codigoLoja ??
      estoqueEncontrado?.codigo_loja ??
      "-";

    const nomeLoja =
      loja.nomeLoja ??
      loja.nome_loja ??
      loja.nome ??
      estoqueEncontrado?.nomeLoja ??
      estoqueEncontrado?.nome_loja ??
      "-";

    return {
      id: lojaId,
      codigoLoja,
      nomeLoja,

      estoqueAtual: Number(
        estoqueEncontrado?.estoqueAtual ??
          estoqueEncontrado?.estoque_atual ??
          loja.estoqueAtual ??
          loja.estoque_atual ??
          0,
      ),

      estoqueMinimo: Number(
        loja.estoqueMinimo ??
          loja.quantidadeMinima ??
          loja.quantidade_minima ??
          estoqueEncontrado?.estoqueMinimo ??
          estoqueEncontrado?.quantidadeMinima ??
          estoqueEncontrado?.quantidade_minima ??
          0,
      ),

      estoqueRecomendado: Number(
        loja.estoqueRecomendado ??
          loja.quantidadeRecomendada ??
          loja.quantidade_recomendada ??
          estoqueEncontrado?.estoqueRecomendado ??
          estoqueEncontrado?.quantidadeRecomendada ??
          estoqueEncontrado?.quantidade_recomendada ??
          0,
      ),

      ativo: loja.ativo,
      criadoEm: loja.criadoEm ?? loja.criado_em,
    };
  });
}

async function cadastrarLojaApi(novaLoja) {
  return await apiFetch("/api/lojas", {
    method: "POST",
    body: JSON.stringify(novaLoja),
  });
}

async function atualizarLojaApi(codigoOriginal, lojaAtualizada) {
  return await apiFetch(`/api/lojas/${codigoOriginal}`, {
    method: "PUT",
    body: JSON.stringify(lojaAtualizada),
  });
}

async function inativarLojaApi(codigo) {
  return await apiFetch(`/api/lojas/${codigo}/inativar`, {
    method: "PATCH",
  });
}

function obterStatusEstoque(loja) {
  const estoqueAtual = Number(loja.estoqueAtual || 0);
  const estoqueMinimo = Number(loja.estoqueMinimo || 0);
  const estoqueRecomendado = Number(loja.estoqueRecomendado || 0);

  if (estoqueAtual <= estoqueMinimo) return "Crítico";
  if (estoqueAtual < estoqueRecomendado) return "Atenção";

  return "Normal";
}

function obterClassesStatus(status) {
  if (status === "Crítico") return "badge-critico";
  if (status === "Atenção") return "badge-atencao";

  return "badge-normal";
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

async function carregarCardsLojas() {
  try {
    const lojas = await buscarLojasComEstoqueApi();
    lojasCarregadas = lojas;

    const totalLojas = lojas.length;

    const lojasAtivas = lojas.filter(function (loja) {
      return loja.ativo !== false;
    }).length;

    const lojasCriticas = lojas.filter(function (loja) {
      return obterStatusEstoque(loja) === "Crítico";
    }).length;

    const lojasAtencao = lojas.filter(function (loja) {
      return obterStatusEstoque(loja) === "Atenção";
    }).length;

    const el1 = document.getElementById("totalLojas");
    const el2 = document.getElementById("lojasAtivas");
    const el3 = document.getElementById("lojasCriticas");
    const el4 = document.getElementById("lojasAtencao");

    if (el1) el1.textContent = totalLojas;
    if (el2) el2.textContent = lojasAtivas;
    if (el3) el3.textContent = lojasCriticas;
    if (el4) el4.textContent = lojasAtencao;
  } catch (erro) {
    console.error("Erro ao carregar cards de lojas:", erro);
    mostrarAlerta("Não foi possível carregar os dados das lojas.", true);
  }
}

async function carregarTabelaLojas() {
  const tabela = document.getElementById("tabelaLojas");

  if (!tabela) {
    return;
  }

  try {
    tabela.innerHTML = "";

    const lojas = await buscarLojasComEstoqueApi();
    lojasCarregadas = lojas;

    if (lojas.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            Nenhuma loja encontrada para o seu usuário.
          </td>
        </tr>
      `;
      return;
    }

    lojas.forEach(function (loja) {
      const status = obterStatusEstoque(loja);
      const classesStatus = obterClassesStatus(status);

      tabela.innerHTML += `
        <tr>
          <td>${loja.codigoLoja || "-"}</td>
          <td>${loja.nomeLoja || "-"}</td>
          <td>${loja.estoqueAtual ?? 0}</td>
          <td>${loja.estoqueMinimo ?? 0}</td>
          <td>${loja.estoqueRecomendado ?? 0}</td>
          <td>
            <span class="badge-status ${classesStatus}">
              ${status}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button
                class="btn-table-action btn-sm"
                onclick="editarLoja('${loja.codigoLoja}')"
              >
                Editar
              </button>

              <button
                class="btntable-action btn-sm"
                onclick="excluirLoja('${loja.codigoLoja}')"
              >
                Inativar
              </button>

              <button
                class="btn-table-action btn-sm"
                onclick="verDetalhesLoja('${loja.codigoLoja}')"
              >
                Ver detalhes
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
    console.error("Erro ao carregar tabela de lojas:", erro);
    mostrarAlerta("Não foi possível carregar as lojas cadastradas.", true);
  }
}

function abrirFormularioLoja() {
  const form = document.getElementById("formLoja");

  if (form) {
    form.reset();
  }

  codigoLojaEditando = null;

  const inputCodigo = document.getElementById("codigoLoja");
  const inputEstoque = document.getElementById("estoqueAtual");
  const estoqueMin = document.getElementById("estoqueMinimo");
  const estoqueRec = document.getElementById("estoqueRecomendado");

  if (inputCodigo) {
    inputCodigo.readOnly = false;
  }

  if (inputEstoque) {
    inputEstoque.value = 0;
    inputEstoque.readOnly = false;
  }

  if (estoqueMin) {
    estoqueMin.value = 200;
    estoqueMin.readOnly = false;
  }

  if (estoqueRec) {
    estoqueRec.value = 300;
    estoqueRec.readOnly = false;
  }

  const btnSalvar = document.getElementById("btnSalvarLoja");

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar Loja";
  }

  const container = document.getElementById("formLojaContainer");
  const overlay = document.getElementById("formLojaOverlay");

  if (container) container.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
}

function fecharFormularioLoja() {
  const container = document.getElementById("formLojaContainer");
  const overlay = document.getElementById("formLojaOverlay");

  if (container) container.classList.add("hidden");
  if (overlay) overlay.classList.add("hidden");
}

function fecharDetalhesLoja() {
  const container = document.getElementById("detalhesLojaContainer");
  const overlay = document.getElementById("detalhesLojaOverlay");

  if (container) container.classList.add("hidden");
  if (overlay) overlay.classList.add("hidden");
}

function verDetalhesLoja(codigo) {
  const loja = lojasCarregadas.find(function (item) {
    return String(item.codigoLoja) === String(codigo);
  });

  if (!loja) {
    mostrarAlerta("Loja não encontrada.", true);
    return;
  }

  const status = obterStatusEstoque(loja);
  const classeStatus = obterClassesStatus(status);
  const conteudo = document.getElementById("detalhesLojaConteudo");

  if (!conteudo) {
    return;
  }

  const faltaParaMinimo = Math.max(
    Number(loja.estoqueMinimo) - Number(loja.estoqueAtual),
    0,
  );

  const faltaParaRecomendado = Math.max(
    Number(loja.estoqueRecomendado) - Number(loja.estoqueAtual),
    0,
  );

  let mensagemStatus = "A loja está com estoque dentro do nível esperado.";

  if (status === "Crítico") {
    mensagemStatus = "Esta loja está em situação crítica.";
  }

  if (status === "Atenção") {
    mensagemStatus = "Esta loja precisa de atenção.";
  }

  conteudo.innerHTML = `
    <div class="detail-row">
      <strong>Código</strong>
      <span>${loja.codigoLoja}</span>
    </div>

    <div class="detail-row">
      <strong>Nome</strong>
      <span>${loja.nomeLoja}</span>
    </div>

    <div class="detail-row">
      <strong>Estoque atual</strong>
      <span>${loja.estoqueAtual} talões</span>
    </div>

    <div class="detail-row">
      <strong>Estoque mínimo</strong>
      <span>${loja.estoqueMinimo} talões</span>
    </div>

    <div class="detail-row">
      <strong>Estoque recomendado</strong>
      <span>${loja.estoqueRecomendado} talões</span>
    </div>

    <div class="detail-row">
      <strong>Status</strong>
      <span class="badge-status ${classeStatus}">${status}</span>
    </div>

    <div class="detail-row">
      <strong>Falta para mínimo</strong>
      <span>${faltaParaMinimo} talões</span>
    </div>

    <div class="detail-row">
      <strong>Falta para recomendado</strong>
      <span>${faltaParaRecomendado} talões</span>
    </div>

    <div class="detail-insight">
      <strong>Análise:</strong> ${mensagemStatus}
    </div>
  `;

  const container = document.getElementById("detalhesLojaContainer");
  const overlay = document.getElementById("detalhesLojaOverlay");

  if (container) container.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
}

function editarLoja(codigo) {
  const lojaEncontrada = lojasCarregadas.find(function (item) {
    return String(item.codigoLoja) === String(codigo);
  });

  if (!lojaEncontrada) {
    mostrarAlerta("Loja não encontrada.", true);
    return;
  }

  codigoLojaEditando = codigo;

  const inputCodigo = document.getElementById("codigoLoja");
  const inputNome = document.getElementById("nomeLoja");
  const inputEstoque = document.getElementById("estoqueAtual");
  const inputMin = document.getElementById("estoqueMinimo");
  const inputRec = document.getElementById("estoqueRecomendado");
  const btnSalvar = document.getElementById("btnSalvarLoja");

  if (inputCodigo) {
    inputCodigo.value = lojaEncontrada.codigoLoja;
    inputCodigo.readOnly = true;
  }

  if (inputNome) {
    inputNome.value = lojaEncontrada.nomeLoja;
  }

  if (inputEstoque) {
    inputEstoque.value = lojaEncontrada.estoqueAtual;
    inputEstoque.readOnly = true;
  }

  if (inputMin) {
    inputMin.value = lojaEncontrada.estoqueMinimo;
    inputMin.readOnly = false;
  }

  if (inputRec) {
    inputRec.value = lojaEncontrada.estoqueRecomendado;
    inputRec.readOnly = false;
  }

  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar Loja";
  }

  const container = document.getElementById("formLojaContainer");
  const overlay = document.getElementById("formLojaOverlay");

  if (container) container.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
}

function excluirLoja(codigo) {
  const lojaEncontrada = lojasCarregadas.find(function (item) {
    return String(item.codigoLoja) === String(codigo);
  });

  if (!lojaEncontrada) {
    mostrarAlerta("Loja não encontrada.", true);
    return;
  }

  codigoLojaExcluindo = codigo;

  const nome = document.getElementById("nomeLojaExclusao");
  const cod = document.getElementById("codigoLojaExclusao");

  if (nome) {
    nome.textContent = lojaEncontrada.nomeLoja;
  }

  if (cod) {
    cod.textContent = "Código: " + lojaEncontrada.codigoLoja;
  }

  const container = document.getElementById("excluirLojaContainer");
  const overlay = document.getElementById("excluirLojaOverlay");

  if (container) container.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
}

function fecharConfirmacaoExclusaoLoja() {
  codigoLojaExcluindo = null;

  const container = document.getElementById("excluirLojaContainer");
  const overlay = document.getElementById("excluirLojaOverlay");

  if (container) container.classList.add("hidden");
  if (overlay) overlay.classList.add("hidden");
}

async function confirmarExclusaoLoja() {
  if (codigoLojaExcluindo === null) {
    mostrarAlerta("Nenhuma loja selecionada.", true);
    return;
  }

  try {
    await inativarLojaApi(codigoLojaExcluindo);

    await carregarCardsLojas();
    await carregarTabelaLojas();

    fecharConfirmacaoExclusaoLoja();

    mostrarAlerta("Loja inativada com sucesso.");
  } catch (erro) {
    console.error("Erro ao inativar loja:", erro);
    mostrarAlerta(erro.message, true);
  }
}

async function salvarLoja(event) {
  event.preventDefault();

  const botaoSalvar = document.getElementById("btnSalvarLoja");

  if (botaoSalvar) {
    botaoSalvar.textContent = "Salvando...";
    botaoSalvar.disabled = true;
  }

  try {
    const codigo = document.getElementById("codigoLoja").value.trim();
    const nome = document.getElementById("nomeLoja").value.trim();

    const estoqueAtual = Number(document.getElementById("estoqueAtual").value);

    const estoqueMinimo = Number(
      document.getElementById("estoqueMinimo").value,
    );

    const estoqueRecomendado = Number(
      document.getElementById("estoqueRecomendado").value,
    );

    if (!codigo) {
      throw new Error("Informe o código da loja.");
    }

    if (!nome) {
      throw new Error("Informe o nome da loja.");
    }

    if (Number.isNaN(estoqueMinimo) || estoqueMinimo < 0) {
      throw new Error("Informe um estoque mínimo válido.");
    }

    if (Number.isNaN(estoqueRecomendado) || estoqueRecomendado < 0) {
      throw new Error("Informe um estoque recomendado válido.");
    }

    if (codigoLojaEditando === null) {
      if (Number.isNaN(estoqueAtual) || estoqueAtual < 0) {
        throw new Error("Informe um estoque atual válido.");
      }

      const novaLoja = {
        codigo,
        codigoLoja: codigo,
        nome,
        nomeLoja: nome,
        estoqueAtual,
        estoqueMinimo,
        estoqueRecomendado,
      };

      await cadastrarLojaApi(novaLoja);

      mostrarAlerta("Loja cadastrada com sucesso no banco de dados.");
    } else {
      const lojaAtualizada = {
        codigo,
        codigoLoja: codigo,
        nome,
        nomeLoja: nome,
        estoqueMinimo,
        estoqueRecomendado,
      };

      await atualizarLojaApi(codigoLojaEditando, lojaAtualizada);

      mostrarAlerta("Loja atualizada com sucesso no banco de dados.");
    }

    await carregarCardsLojas();
    await carregarTabelaLojas();

    const formLoja = document.getElementById("formLoja");

    if (formLoja) {
      formLoja.reset();
    }

    fecharFormularioLoja();

    codigoLojaEditando = null;
  } catch (erro) {
    console.error("Erro ao salvar loja:", erro);
    mostrarAlerta(erro.message, true);
  } finally {
    if (botaoSalvar) {
      botaoSalvar.textContent =
        codigoLojaEditando === null ? "Salvar Loja" : "Atualizar Loja";
      botaoSalvar.disabled = false;
    }
  }
}

async function iniciarPaginaLojas() {
  const usuario = carregarUsuarioLogado();

  if (!usuario) {
    return;
  }

  const formLoja = document.getElementById("formLoja");

  if (formLoja) {
    formLoja.addEventListener("submit", salvarLoja);
  }

  await carregarCardsLojas();
  await carregarTabelaLojas();

  if (typeof aplicarPermissoesMenu === "function") {
    aplicarPermissoesMenu();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarPaginaLojas();
});
