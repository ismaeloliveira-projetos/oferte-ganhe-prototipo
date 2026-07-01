let codigoLojaEditando = null;
let codigoLojaExcluindo = null;
let lojasCarregadas = [];

function obterStatusEstoque(loja) {
  if (loja.estoqueAtual <= loja.estoqueMinimo) return "Crítico";
  if (loja.estoqueAtual < loja.estoqueRecomendado) return "Atenção";
  return "Normal";
}

function obterClassesStatus(status) {
  if (status === "Crítico") return "badge-critico";
  if (status === "Atenção") return "badge-atencao";
  return "badge-normal";
}

function buscarTodasLojas() {
  const banco = carregarBanco();
  if (!banco.lojas) {
    banco.lojas = [];
    salvarBanco(banco);
  }
  return banco.lojas;
}

async function buscarLojasApi() {
  const resposta = await fetch("http://localhost:3000/api/lojas");

  if (!resposta.ok) {
    throw new Error("Erro ao buscar lojas no backend");
  }

  const lojas = await resposta.json();

  return lojas;
}

function salvarLojas(lojas) {
  const banco = carregarBanco();
  banco.lojas = lojas;
  salvarBanco(banco);
}

function mostrarAlerta(mensagem) {
  const alerta = document.getElementById("alertaSistema");
  if (!alerta) {
    alert(mensagem);
    return;
  }
  alerta.textContent = mensagem;
  alerta.classList.remove("hidden");
  setTimeout(() => alerta.classList.add("hidden"), 3000);
}

async function carregarCardsLojas() {
  try {
    const lojas = await buscarLojasApi();

    const totalLojas = lojas.length;
    const lojasAtivas = lojas.filter((loja) => loja.ativo === true).length;

    const lojasCriticas = lojas.filter(
      (loja) => obterStatusEstoque(loja) === "Crítico",
    ).length;

    const lojasAtencao = lojas.filter(
      (loja) => obterStatusEstoque(loja) === "Atenção",
    ).length;

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
    alert("Não foi possível carregar os dados das lojas.");
  }
}

async function carregarTabelaLojas() {
  const tabela = document.getElementById("tabelaLojas");
  if (!tabela) return;

  try {
    tabela.innerHTML = "";

    const lojas = await buscarLojasApi();
    lojasCarregadas = lojas;

    lojas.forEach((loja) => {
      const status = obterStatusEstoque(loja);
      const classesStatus = obterClassesStatus(status);

      tabela.innerHTML += `
        <tr>
          <td>${loja.codigo}</td>
          <td>${loja.nome}</td>
          <td>${loja.estoqueAtual}</td>
          <td>${loja.estoqueMinimo}</td>
          <td>${loja.estoqueRecomendado}</td>
          <td><span class="badge ${classesStatus}">${status}</span></td>
          <td>
            <div class="table-actions">
              <button class="btn-table-action btn-sm" onclick="window.editarLoja('${loja.codigo}')">
                Editar
              </button>

              <button class="btn-table-action btn-sm" onclick="window.excluirLoja('${loja.codigo}')">
                Excluir
              </button>

              <button class="btn-table-action btn-sm" onclick="window.verDetalhesLoja('${loja.codigo}')">
                Ver detalhes
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    aplicarResponsividadeTabelas();
  } catch (erro) {
    console.error("Erro ao carregar tabela de lojas:", erro);
    mostrarAlerta("Não foi possível carregar as lojas cadastradas.");
  }
}

function fecharDetalhesLoja() {
  const container = document.getElementById("detalhesLojaContainer");
  const overlay = document.getElementById("detalhesLojaOverlay");
  if (container) container.classList.add("hidden");
  if (overlay) overlay.classList.add("hidden");
}

function abrirFormularioLoja() {
  const form = document.getElementById("formLoja");
  if (form) form.reset();
  codigoLojaEditando = null;

  const estoqueMin = document.getElementById("estoqueMinimo");
  const estoqueRec = document.getElementById("estoqueRecomendado");
  if (estoqueMin) {
    estoqueMin.value = 200;
    estoqueMin.readOnly = true;
  }
  if (estoqueRec) {
    estoqueRec.value = 300;
    estoqueRec.readOnly = true;
  }

  const btnSalvar = document.getElementById("btnSalvarLoja");
  if (btnSalvar) btnSalvar.textContent = "Salvar Loja";

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

window.verDetalhesLoja = function (codigo) {
  const loja = lojasCarregadas.find((l) => l.codigo === codigo);

  if (!loja) {
    mostrarAlerta("Loja não encontrada.");
    return;
  }

  const status = obterStatusEstoque(loja);
  const classeStatus = obterClassesStatus(status);
  const conteudo = document.getElementById("detalhesLojaConteudo");

  if (!conteudo) return;

  const faltaParaMinimo = Math.max(loja.estoqueMinimo - loja.estoqueAtual, 0);
  const faltaParaRecomendado = Math.max(
    loja.estoqueRecomendado - loja.estoqueAtual,
    0,
  );

  let mensagemStatus = "A loja está com estoque dentro do nível esperado.";
  if (status === "Crítico")
    mensagemStatus = "Esta loja está em situação crítica.";
  if (status === "Atenção") mensagemStatus = "Esta loja precisa de atenção.";

  conteudo.innerHTML = `
    <div class="detail-row"><strong>Código</strong><span>${loja.codigo}</span></div>
    <div class="detail-row"><strong>Nome</strong><span>${loja.nome}</span></div>
    <div class="detail-row"><strong>Estoque atual</strong><span>${loja.estoqueAtual} talões</span></div>
    <div class="detail-row"><strong>Estoque mínimo</strong><span>${loja.estoqueMinimo} talões</span></div>
    <div class="detail-row"><strong>Estoque recomendado</strong><span>${loja.estoqueRecomendado} talões</span></div>
    <div class="detail-row"><strong>Status</strong><span class="badge ${classeStatus}">${status}</span></div>
    <div class="detail-row"><strong>Falta para mínimo</strong><span>${faltaParaMinimo} talões</span></div>
    <div class="detail-row"><strong>Falta para recomendado</strong><span>${faltaParaRecomendado} talões</span></div>
    <div class="detail-insight"><strong>Análise:</strong> ${mensagemStatus}</div>
  `;

  const container = document.getElementById("detalhesLojaContainer");
  const overlay = document.getElementById("detalhesLojaOverlay");
  if (container) container.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
};

window.editarLoja = function (codigo) {
  const lojaEncontrada = lojasCarregadas.find((l) => l.codigo === codigo);

  if (!lojaEncontrada) {
    mostrarAlerta("Loja não encontrada.");
    return;
  }

  codigoLojaEditando = codigo;
  const inputCodigo = document.getElementById("codigoLoja");
  const inputNome = document.getElementById("nomeLoja");
  const inputEstoque = document.getElementById("estoqueAtual");
  const inputMin = document.getElementById("estoqueMinimo");
  const inputRec = document.getElementById("estoqueRecomendado");
  const btnSalvar = document.getElementById("btnSalvarLoja");

  if (inputCodigo) inputCodigo.value = lojaEncontrada.codigo;
  if (inputNome) inputNome.value = lojaEncontrada.nome;
  if (inputEstoque) inputEstoque.value = lojaEncontrada.estoqueAtual;
  if (inputMin) {
    inputMin.value = lojaEncontrada.estoqueMinimo;
    inputMin.readOnly = false;
  }
  if (inputRec) {
    inputRec.value = lojaEncontrada.estoqueRecomendado;
    inputRec.readOnly = false;
  }
  if (btnSalvar) btnSalvar.textContent = "Atualizar Loja";

  const container = document.getElementById("formLojaContainer");
  const overlay = document.getElementById("formLojaOverlay");
  if (container) container.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
};

window.excluirLoja = function (codigo) {
  const lojaEncontrada = lojasCarregadas.find((l) => l.codigo === codigo);

  if (!lojaEncontrada) {
    mostrarAlerta("Loja não encontrada.");
    return;
  }

  codigoLojaExcluindo = codigo;
  const nome = document.getElementById("nomeLojaExclusao");
  const cod = document.getElementById("codigoLojaExclusao");

  if (nome) nome.textContent = lojaEncontrada.nome;
  if (cod) cod.textContent = "Código: " + lojaEncontrada.codigo;

  const container = document.getElementById("excluirLojaContainer");
  const overlay = document.getElementById("excluirLojaOverlay");
  if (container) container.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
};

function fecharConfirmacaoExclusaoLoja() {
  codigoLojaExcluindo = null;
  const container = document.getElementById("excluirLojaContainer");
  const overlay = document.getElementById("excluirLojaOverlay");
  if (container) container.classList.add("hidden");
  if (overlay) overlay.classList.add("hidden");
}

function confirmarExclusaoLoja() {
  if (codigoLojaExcluindo === null) {
    mostrarAlerta("Nenhuma loja selecionada.");
    return;
  }

  const lojas = buscarTodasLojas();
  const lojasAtualizadas = lojas.filter(
    (l) => l.codigo !== codigoLojaExcluindo,
  );

  salvarLojas(lojasAtualizadas);
  carregarCardsLojas();
  carregarTabelaLojas();
  fecharConfirmacaoExclusaoLoja();
  mostrarAlerta("Loja excluída com sucesso.");
}

const formLoja = document.getElementById("formLoja");
if (formLoja) {
  formLoja.addEventListener("submit", function (event) {
    event.preventDefault();

    const botaoSalvar = document.getElementById("btnSalvarLoja");
    if (botaoSalvar) {
      botaoSalvar.textContent = "Salvando...";
      botaoSalvar.disabled = true;
    }

    setTimeout(() => {
      const codigo = document.getElementById("codigoLoja").value;
      const nome = document.getElementById("nomeLoja").value;
      const estoqueAtual = Number(
        document.getElementById("estoqueAtual").value,
      );
      const estoqueMinimo = Number(
        document.getElementById("estoqueMinimo").value,
      );
      const estoqueRecomendado = Number(
        document.getElementById("estoqueRecomendado").value,
      );

      const lojas = buscarTodasLojas();

      if (codigoLojaEditando === null) {
        const novaLoja = {
          codigo,
          nome,
          estoqueAtual,
          estoqueMinimo,
          estoqueRecomendado,
          status: "Ativa",
        };
        lojas.push(novaLoja);
        salvarLojas(lojas);
        mostrarAlerta("Loja cadastrada com sucesso.");
      } else {
        const lojasAtualizadas = lojas.map((loja) => {
          if (loja.codigo === codigoLojaEditando) {
            return {
              ...loja,
              codigo,
              nome,
              estoqueAtual,
              estoqueMinimo,
              estoqueRecomendado,
            };
          }
          return loja;
        });
        salvarLojas(lojasAtualizadas);
        mostrarAlerta("Loja atualizada com sucesso.");
      }

      carregarCardsLojas();
      carregarTabelaLojas();

      if (botaoSalvar) {
        botaoSalvar.textContent = "Salvar Loja";
        botaoSalvar.disabled = false;
      }

      setTimeout(() => {
        document.getElementById("formLoja").reset();
        fecharFormularioLoja();
        codigoLojaEditando = null;
      }, 700);
    }, 800);
  });
}

carregarUsuarioLogado();
carregarCardsLojas();
carregarTabelaLojas();
aplicarPermissoesMenu();
