const API_PERFIS_URL = "http://localhost:3000/api/perfis";

let perfilEditandoId = null;
let perfilExcluindoId = null;
let perfisCarregados = [];

function mostrarAlerta(mensagem) {
  const alerta = document.getElementById("alertaSistema");

  if (!alerta) {
    alert(mensagem);
    return;
  }

  alerta.textContent = mensagem;
  alerta.classList.remove("hidden");

  setTimeout(function () {
    alerta.classList.add("hidden");
  }, 3000);
}

async function buscarPerfisApi() {
  const resposta = await fetch(API_PERFIS_URL);

  if (!resposta.ok) {
    throw new Error("Erro ao buscar perfis.");
  }

  return await resposta.json();
}

async function criarPerfilApi(dados) {
  const resposta = await fetch(API_PERFIS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || "Erro ao cadastrar perfil.");
  }

  return corpo;
}

async function atualizarPerfilApi(id, dados) {
  const resposta = await fetch(`${API_PERFIS_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || "Erro ao atualizar perfil.");
  }

  return corpo;
}

async function inativarPerfilApi(id) {
  const resposta = await fetch(`${API_PERFIS_URL}/${id}/inativar`, {
    method: "PATCH",
  });

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || "Erro ao inativar perfil.");
  }

  return corpo;
}

function obterPermissoesSelecionadas() {
  const checkboxesMarcados = document.querySelectorAll(
    ".permissao-checkbox:checked",
  );

  const permissoes = [];

  checkboxesMarcados.forEach(function (checkbox) {
    permissoes.push(checkbox.value);
  });

  return permissoes;
}

function limparPermissoes() {
  const checkboxes = document.querySelectorAll(".permissao-checkbox");

  checkboxes.forEach(function (checkbox) {
    checkbox.checked = false;
  });
}

function marcarPermissoes(permissoes) {
  const checkboxes = document.querySelectorAll(".permissao-checkbox");

  checkboxes.forEach(function (checkbox) {
    checkbox.checked = permissoes.includes(checkbox.value);
  });
}

async function carregarTabelaPerfis() {
  const tabela = document.getElementById("tabelaPerfis");

  if (!tabela) {
    return;
  }

  tabela.innerHTML = `
    <tr>
      <td colspan="3">Carregando perfis...</td>
    </tr>
  `;

  try {
    const perfis = await buscarPerfisApi();

    perfisCarregados = perfis;
    tabela.innerHTML = "";

    if (perfis.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="3">Nenhum perfil cadastrado.</td>
        </tr>
      `;
      return;
    }

    perfis.forEach(function (perfil) {
      const totalPermissoes = perfil.permissoes ? perfil.permissoes.length : 0;

      tabela.innerHTML += `
        <tr>
          <td>${perfil.nomePerfil}</td>
          <td>${totalPermissoes}</td>
          <td>
            <button class="btn-table-action btn-sm" onclick="editarPerfil(${perfil.id})">
              Editar
            </button>

            <button class="btn-tableaction btn-sm" onclick="excluirPerfil(${perfil.id})">
              Inativar
            </button>
          </td>
        </tr>
      `;
    });

    if (typeof aplicarResponsividadeTabelas === "function") {
      aplicarResponsividadeTabelas();
    }
  } catch (erro) {
    console.error(erro);

    tabela.innerHTML = `
      <tr>
        <td colspan="3">Erro ao carregar perfis.</td>
      </tr>
    `;

    mostrarAlerta("Erro ao carregar perfis.");
  }
}

function abrirFormularioPerfil() {
  perfilEditandoId = null;

  document.getElementById("formPerfil").reset();
  limparPermissoes();

  document.getElementById("btnSalvarPerfil").textContent = "Salvar Perfil";
  document.getElementById("formPerfilContainer").classList.remove("hidden");
  document.getElementById("formPerfilOverlay").classList.remove("hidden");
}

function fecharFormularioPerfil() {
  perfilEditandoId = null;

  document.getElementById("formPerfilContainer").classList.add("hidden");
  document.getElementById("formPerfilOverlay").classList.add("hidden");
}

function editarPerfil(id) {
  const perfilEncontrado = perfisCarregados.find(function (perfil) {
    return perfil.id === id;
  });

  if (!perfilEncontrado) {
    mostrarAlerta("Perfil não encontrado.");
    return;
  }

  perfilEditandoId = id;

  document.getElementById("nomePerfil").value = perfilEncontrado.nomePerfil;
  document.getElementById("nivelPerfil").value = perfilEncontrado.nivel || 1;

  limparPermissoes();
  marcarPermissoes(perfilEncontrado.permissoes || []);

  document.getElementById("btnSalvarPerfil").textContent = "Atualizar Perfil";
  document.getElementById("formPerfilContainer").classList.remove("hidden");
  document.getElementById("formPerfilOverlay").classList.remove("hidden");
}

function excluirPerfil(id) {
  const perfilEncontrado = perfisCarregados.find(function (perfil) {
    return perfil.id === id;
  });

  if (!perfilEncontrado) {
    mostrarAlerta("Perfil não encontrado.");
    return;
  }

  perfilExcluindoId = id;

  const totalPermissoes = perfilEncontrado.permissoes
    ? perfilEncontrado.permissoes.length
    : 0;

  document.getElementById("nomePerfilExclusao").textContent =
    perfilEncontrado.nomePerfil;

  document.getElementById("permissoesPerfilExclusao").textContent =
    totalPermissoes + " permissões vinculadas";

  document.getElementById("excluirPerfilContainer").classList.remove("hidden");
  document.getElementById("excluirPerfilOverlay").classList.remove("hidden");
}

function fecharConfirmacaoExclusaoPerfil() {
  perfilExcluindoId = null;

  document.getElementById("excluirPerfilContainer").classList.add("hidden");
  document.getElementById("excluirPerfilOverlay").classList.add("hidden");
}

async function confirmarExclusaoPerfil() {
  if (perfilExcluindoId === null) {
    mostrarAlerta("Nenhum perfil selecionado para inativação.");
    return;
  }

  try {
    await inativarPerfilApi(perfilExcluindoId);

    await carregarTabelaPerfis();

    fecharConfirmacaoExclusaoPerfil();

    mostrarAlerta("Perfil inativado com sucesso.");
  } catch (erro) {
    console.error(erro);
    mostrarAlerta(erro.message);
  }
}

document
  .getElementById("formPerfil")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const nomePerfil = document.getElementById("nomePerfil").value.trim();
    const nivel = Number(document.getElementById("nivelPerfil").value);
    const permissoes = obterPermissoesSelecionadas();

    if (!nomePerfil) {
      mostrarAlerta("Informe o nome do perfil.");
      return;
    }

    if (Number.isNaN(nivel) || nivel < 1 || nivel > 4) {
      mostrarAlerta("O nível deve estar entre 1 e 4.");
      return;
    }

    if (permissoes.length === 0) {
      mostrarAlerta("Selecione pelo menos uma permissão.");
      return;
    }

    const dadosPerfil = {
      nomePerfil,
      nivel,
      permissoes,
    };

    const botaoSalvar = document.getElementById("btnSalvarPerfil");
    const textoOriginal = botaoSalvar.textContent;

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    try {
      if (perfilEditandoId === null) {
        await criarPerfilApi(dadosPerfil);
        mostrarAlerta("Perfil cadastrado com sucesso.");
      } else {
        await atualizarPerfilApi(perfilEditandoId, dadosPerfil);
        mostrarAlerta("Perfil atualizado com sucesso.");
      }

      await carregarTabelaPerfis();

      fecharFormularioPerfil();
    } catch (erro) {
      console.error(erro);
      mostrarAlerta(erro.message);
    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = textoOriginal;
      perfilEditandoId = null;
    }
  });

carregarUsuarioLogado();
carregarTabelaPerfis();
