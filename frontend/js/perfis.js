let perfilEditandoId = null;
let perfilExcluindoId = null;

function buscarPerfisSalvos() {
  const banco = carregarBanco();
  if (!banco.perfis) {
    banco.perfis = [];
    salvarBanco(banco);
  }
  return banco.perfis;
}

function salvarPerfis(perfis) {
  const banco = carregarBanco();
  banco.perfis = perfis;
  salvarBanco(banco);
}

function mostrarAlerta(mensagem) {
  const alerta = document.getElementById("alertaSistema");
  alerta.textContent = mensagem;
  alerta.classList.remove("hidden");
  setTimeout(() => alerta.classList.add("hidden"), 3000);
}

function carregarTabelaPerfis() {
  const tabela = document.getElementById("tabelaPerfis");
  tabela.innerHTML = "";
  const perfis = buscarPerfisSalvos();

  perfis.forEach(function (perfil) {
    const totalPermissoes = perfil.permissoes ? perfil.permissoes.length : 0;

    tabela.innerHTML += `
            <tr>
                <td>${perfil.nome}</td>
                <td>${totalPermissoes}</td>
                <td>
                    <button class="btn-table-action btn-sm" onclick="editarPerfil(${perfil.id})">
                        Editar
                    </button>
                    <button class="btn-table-action btn-sm" onclick="excluirPerfil(${perfil.id})">
                        Excluir
                    </button>
                </td>
            </tr>
        `;
  });

  aplicarResponsividadeTabelas();
}

function obterPermissoesSelecionadas() {
  const checkboxesMarcados = document.querySelectorAll(
    ".permissao-checkbox:checked",
  );
  const permissoes = [];
  checkboxesMarcados.forEach((checkbox) => permissoes.push(checkbox.value));
  return permissoes;
}

function limparPermissoes() {
  const checkboxes = document.querySelectorAll(".permissao-checkbox");
  checkboxes.forEach((checkbox) => (checkbox.checked = false));
}

function marcarPermissoes(permissoes) {
  const checkboxes = document.querySelectorAll(".permissao-checkbox");
  checkboxes.forEach(
    (checkbox) => (checkbox.checked = permissoes.includes(checkbox.value)),
  );
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
  document.getElementById("formPerfilContainer").classList.add("hidden");
  document.getElementById("formPerfilOverlay").classList.add("hidden");
}

function editarPerfil(id) {
  const perfis = buscarPerfisSalvos();
  const perfilEncontrado = perfis.find((perfil) => perfil.id === id);

  if (!perfilEncontrado) {
    mostrarAlerta("Perfil não encontrado.");
    return;
  }

  perfilEditandoId = id;
  document.getElementById("nomePerfil").value = perfilEncontrado.nome;
  document.getElementById("nivelPerfil").value = perfilEncontrado.nivel || 1;
  limparPermissoes();
  marcarPermissoes(perfilEncontrado.permissoes || []);
  document.getElementById("btnSalvarPerfil").textContent = "Atualizar Perfil";
  document.getElementById("formPerfilContainer").classList.remove("hidden");
  document.getElementById("formPerfilOverlay").classList.remove("hidden");
}

function excluirPerfil(id) {
  const perfis = buscarPerfisSalvos();
  const perfilEncontrado = perfis.find((perfil) => perfil.id === id);

  if (!perfilEncontrado) {
    mostrarAlerta("Perfil não encontrado.");
    return;
  }

  perfilExcluindoId = id;
  const totalPermissoes = perfilEncontrado.permissoes
    ? perfilEncontrado.permissoes.length
    : 0;

  document.getElementById("nomePerfilExclusao").textContent =
    perfilEncontrado.nome;
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

function confirmarExclusaoPerfil() {
  if (perfilExcluindoId === null) {
    mostrarAlerta("Nenhum perfil selecionado para exclusão.");
    return;
  }

  const perfis = buscarPerfisSalvos();
  const perfisAtualizados = perfis.filter(
    (perfil) => perfil.id !== perfilExcluindoId,
  );

  salvarPerfis(perfisAtualizados);
  carregarTabelaPerfis();
  fecharConfirmacaoExclusaoPerfil();
  mostrarAlerta("Perfil excluído com sucesso.");
}

document
  .getElementById("formPerfil")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nomePerfil").value;
    const nivel = Number(document.getElementById("nivelPerfil").value);
    const permissoes = obterPermissoesSelecionadas();

    if (permissoes.length === 0) {
      mostrarAlerta("Selecione pelo menos uma permissão.");
      return;
    }

    if (nivel < 1 || nivel > 4) {
      mostrarAlerta("O nível deve estar entre 1 e 4.");
      return;
    }

    const perfis = buscarPerfisSalvos();

    if (perfilEditandoId === null) {
      const novoPerfil = {
        id: Date.now(),
        nome: nome,
        nivel: nivel,
        permissoes: permissoes,
      };
      perfis.push(novoPerfil);
      salvarPerfis(perfis);
      mostrarAlerta("Perfil cadastrado com sucesso.");
    } else {
      const perfisAtualizados = perfis.map((perfil) => {
        if (perfil.id === perfilEditandoId) {
          return {
            ...perfil,
            nome: nome,
            nivel: nivel,
            permissoes: permissoes,
          };
        }
        return perfil;
      });
      salvarPerfis(perfisAtualizados);
      mostrarAlerta("Perfil atualizado com sucesso.");
    }

    carregarTabelaPerfis();
    fecharFormularioPerfil();
    perfilEditandoId = null;
    document.getElementById("btnSalvarPerfil").textContent = "Salvar Perfil";
  });

carregarUsuarioLogado();
carregarTabelaPerfis();
