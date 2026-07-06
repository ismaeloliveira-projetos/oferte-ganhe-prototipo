const API_USUARIOS_URL = "http://localhost:3000/api/usuarios";
const API_PERFIS_URL = "http://localhost:3000/api/perfis";
const API_LOJAS_URL = "http://localhost:3000/api/lojas";

let usuarioEditandoId = null;
let usuarioExcluindoId = null;

let usuariosCarregados = [];
let perfisDisponiveis = [];
let lojasDisponiveis = [];
let perfisPorUsuario = {};
let lojasPorUsuario = {};

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

async function buscarApi(url) {
  const resposta = await fetch(url);
  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || "Erro ao buscar dados.");
  }

  return corpo;
}

async function enviarApi(url, metodo, dados) {
  const resposta = await fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || "Erro ao salvar dados.");
  }

  return corpo;
}

async function criarUsuarioApi(dados) {
  return await enviarApi(API_USUARIOS_URL, "POST", dados);
}

async function atualizarUsuarioApi(id, dados) {
  return await enviarApi(`${API_USUARIOS_URL}/${id}`, "PUT", dados);
}

async function inativarUsuarioApi(id) {
  const resposta = await fetch(`${API_USUARIOS_URL}/${id}/inativar`, {
    method: "PATCH",
  });

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || "Erro ao inativar usuário.");
  }

  return corpo;
}

async function buscarPerfisDoUsuario(usuarioId) {
  const resposta = await fetch(`${API_PERFIS_URL}/usuarios/${usuarioId}`);
  const corpo = await resposta.json();

  if (!resposta.ok) {
    return [];
  }

  return corpo;
}

async function vincularPerfilAoUsuario(usuarioId, perfilId) {
  return await enviarApi(`${API_PERFIS_URL}/usuarios/${usuarioId}`, "POST", {
    perfilId: Number(perfilId),
  });
}

async function removerPerfilDoUsuario(usuarioId, perfilId) {
  const resposta = await fetch(
    `${API_PERFIS_URL}/usuarios/${usuarioId}/${perfilId}`,
    {
      method: "DELETE",
    },
  );

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || "Erro ao remover perfil do usuário.");
  }

  return corpo;
}

async function atualizarPerfilDoUsuario(usuarioId, novoPerfilId) {
  const perfisAtuais = await buscarPerfisDoUsuario(usuarioId);

  for (const perfil of perfisAtuais) {
    await removerPerfilDoUsuario(usuarioId, perfil.perfilId);
  }

  await vincularPerfilAoUsuario(usuarioId, novoPerfilId);
}

async function buscarLojasDoUsuario(usuarioId) {
  const resposta = await fetch(`${API_USUARIOS_URL}/${usuarioId}/lojas`);
  const corpo = await resposta.json();

  if (!resposta.ok) {
    return {
      usuarioId,
      escopo: "TODAS_AS_LOJAS",
      lojas: [],
    };
  }

  return corpo;
}

async function vincularLojaAoUsuario(usuarioId, lojaId) {
  const resposta = await fetch(`${API_USUARIOS_URL}/${usuarioId}/lojas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lojaId: lojaId ? Number(lojaId) : null,
    }),
  });

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || "Erro ao vincular loja ao usuário.");
  }

  return corpo;
}

async function carregarLojasDosUsuarios(usuarios) {
  lojasPorUsuario = {};

  await Promise.all(
    usuarios.map(async function (usuario) {
      const resultado = await buscarLojasDoUsuario(usuario.id);
      lojasPorUsuario[usuario.id] = resultado;
    }),
  );
}

function obterNomePerfilUsuario(usuarioId) {
  const perfis = perfisPorUsuario[usuarioId] || [];

  if (perfis.length === 0) {
    return "Sem perfil";
  }

  return perfis
    .map(function (perfil) {
      return perfil.nomePerfil;
    })
    .join(", ");
}

function obterPrimeiroPerfilIdUsuario(usuarioId) {
  const perfis = perfisPorUsuario[usuarioId] || [];

  if (perfis.length === 0) {
    return "";
  }

  return perfis[0].perfilId;
}

function obterNomeLojaUsuario(usuarioId) {
  const resultado = lojasPorUsuario[usuarioId];

  if (!resultado) {
    return "Carregando...";
  }

  if (resultado.escopo === "TODAS_AS_LOJAS" || resultado.lojas.length === 0) {
    return "Geral (Todas)";
  }

  return resultado.lojas
    .map(function (loja) {
      return loja.codigoLoja + " - " + loja.nomeLoja;
    })
    .join(", ");
}

function obterPrimeiraLojaIdUsuario(usuarioId) {
  const resultado = lojasPorUsuario[usuarioId];

  if (!resultado || resultado.lojas.length === 0) {
    return "";
  }

  return resultado.lojas[0].id;
}

async function carregarPerfisNoFormulario() {
  const selectPerfil = document.getElementById("perfilUsuario");

  if (!selectPerfil) {
    return;
  }

  try {
    perfisDisponiveis = await buscarApi(API_PERFIS_URL);

    selectPerfil.innerHTML = `
      <option value="">Selecione um perfil</option>
    `;

    perfisDisponiveis.forEach(function (perfil) {
      selectPerfil.innerHTML += `
        <option value="${perfil.id}">
          ${perfil.nomePerfil}
        </option>
      `;
    });
  } catch (erro) {
    console.error(erro);
    mostrarAlerta("Erro ao carregar perfis.");
  }
}

async function carregarLojasNoFormulario() {
  const selectLoja = document.getElementById("lojaUsuario");

  if (!selectLoja) {
    return;
  }

  try {
    lojasDisponiveis = await buscarApi(API_LOJAS_URL);

    selectLoja.innerHTML = `
      <option value="">Administrador Geral (Todas as lojas)</option>
    `;

    lojasDisponiveis.forEach(function (loja) {
      const id = loja.id;
      const codigo = loja.codigoLoja || loja.codigo;
      const nome = loja.nomeLoja || loja.nome;

      selectLoja.innerHTML += `
        <option value="${id}">
          ${codigo} - ${nome}
        </option>
      `;
    });
  } catch (erro) {
    console.error(erro);
    mostrarAlerta("Erro ao carregar lojas.");
  }
}

async function carregarPerfisDosUsuarios(usuarios) {
  perfisPorUsuario = {};

  await Promise.all(
    usuarios.map(async function (usuario) {
      const perfis = await buscarPerfisDoUsuario(usuario.id);
      perfisPorUsuario[usuario.id] = perfis;
    }),
  );
}

function renderizarTabelaUsuarios(listaUsuarios) {
  const tabela = document.getElementById("tabelaUsuarios");

  if (!tabela) {
    return;
  }

  tabela.innerHTML = "";

  if (listaUsuarios.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6">Nenhum usuário cadastrado.</td>
      </tr>
    `;
    return;
  }

  listaUsuarios.forEach(function (usuario) {
    const nomePerfil = obterNomePerfilUsuario(usuario.id);
    const nomeLoja = obterNomeLojaUsuario(usuario.id);

    tabela.innerHTML += `
      <tr>
        <td>${usuario.nome}</td>
        <td>${usuario.matricula}</td>
        <td>${usuario.email}</td>
        <td><span class="badge badge-normal">${nomePerfil}</span></td>
        <td>${nomeLoja}</td>
        <td>
          <button class="btn-table-action btn-sm" onclick="editarUsuario(${usuario.id})">
            Editar
          </button>

          <button class="btn-tableaction btn-sm" onclick="excluirUsuario(${usuario.id})">
            Inativar
          </button>
        </td>
      </tr>
    `;
  });

  if (typeof aplicarResponsividadeTabelas === "function") {
    aplicarResponsividadeTabelas();
  }
}

async function carregarTabelaUsuarios(listaUsuarios) {
  const tabela = document.getElementById("tabelaUsuarios");

  if (!tabela) {
    return;
  }

  tabela.innerHTML = `
    <tr>
      <td colspan="6">Carregando usuários...</td>
    </tr>
  `;

  try {
    if (!listaUsuarios) {
      usuariosCarregados = await buscarApi(API_USUARIOS_URL);

      await carregarPerfisDosUsuarios(usuariosCarregados);
      await carregarLojasDosUsuarios(usuariosCarregados);

      renderizarTabelaUsuarios(usuariosCarregados);
      return;
    }

    renderizarTabelaUsuarios(listaUsuarios);
  } catch (erro) {
    console.error(erro);

    tabela.innerHTML = `
      <tr>
        <td colspan="6">Erro ao carregar usuários.</td>
      </tr>
    `;

    mostrarAlerta("Erro ao carregar usuários.");
  }
}

async function abrirFormularioUsuario() {
  usuarioEditandoId = null;

  const form = document.getElementById("formUsuario");

  if (form) {
    form.reset();
  }

  await carregarPerfisNoFormulario();
  await carregarLojasNoFormulario();

  const inputSenha = document.getElementById("senhaUsuario");
  const btnSalvar = document.getElementById("btnSalvarUsuario");

  if (inputSenha) {
    inputSenha.required = true;
    inputSenha.value = "";
    inputSenha.placeholder = "Digite a senha";
  }

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar Usuário";
  }

  const titulo = document.querySelector(
    "#formUsuarioContainer .content-card-header h2",
  );
  const subtitulo = document.querySelector(
    "#formUsuarioContainer .content-card-header span",
  );

  if (titulo) {
    titulo.textContent = "Novo Usuário";
  }

  if (subtitulo) {
    subtitulo.textContent = "Preencha os dados para cadastrar um novo usuário";
  }

  document.getElementById("formUsuarioContainer").classList.remove("hidden");
  document.getElementById("formUsuarioOverlay").classList.remove("hidden");
}

function fecharFormularioUsuario() {
  usuarioEditandoId = null;

  document.getElementById("formUsuarioContainer").classList.add("hidden");
  document.getElementById("formUsuarioOverlay").classList.add("hidden");
}

async function editarUsuario(id) {
  const usuarioEncontrado = usuariosCarregados.find(function (usuario) {
    return usuario.id === id;
  });

  if (!usuarioEncontrado) {
    mostrarAlerta("Usuário não encontrado.");
    return;
  }

  usuarioEditandoId = id;

  await carregarPerfisNoFormulario();
  await carregarLojasNoFormulario();

  document.getElementById("nomeUsuarioInput").value = usuarioEncontrado.nome;
  document.getElementById("matriculaUsuario").value =
    usuarioEncontrado.matricula;
  document.getElementById("emailUsuario").value = usuarioEncontrado.email;

  const inputSenha = document.getElementById("senhaUsuario");

  if (inputSenha) {
    inputSenha.required = false;
    inputSenha.value = "";
    inputSenha.placeholder = "Deixe em branco para manter a senha atual";
  }

  document.getElementById("perfilUsuario").value = obterPrimeiroPerfilIdUsuario(
    usuarioEncontrado.id,
  );

  const selectLoja = document.getElementById("lojaUsuario");

  if (selectLoja) {
    selectLoja.value = obterPrimeiraLojaIdUsuario(usuarioEncontrado.id);
  }

  const btnSalvar = document.getElementById("btnSalvarUsuario");

  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar Usuário";
  }

  const titulo = document.querySelector(
    "#formUsuarioContainer .content-card-header h2",
  );

  const subtitulo = document.querySelector(
    "#formUsuarioContainer .content-card-header span",
  );

  if (titulo) {
    titulo.textContent = "Editar Usuário";
  }

  if (subtitulo) {
    subtitulo.textContent = "Atualize os dados e o perfil de acesso do usuário";
  }

  document.getElementById("formUsuarioContainer").classList.remove("hidden");
  document.getElementById("formUsuarioOverlay").classList.remove("hidden");
}

function excluirUsuario(id) {
  const usuarioEncontrado = usuariosCarregados.find(function (usuario) {
    return usuario.id === id;
  });

  if (!usuarioEncontrado) {
    mostrarAlerta("Usuário não encontrado.");
    return;
  }

  usuarioExcluindoId = id;

  document.getElementById("nomeUsuarioExclusao").textContent =
    usuarioEncontrado.nome;

  document.getElementById("emailUsuarioExclusao").textContent =
    usuarioEncontrado.email;

  document.getElementById("excluirUsuarioContainer").classList.remove("hidden");
  document.getElementById("excluirUsuarioOverlay").classList.remove("hidden");
}

function fecharConfirmacaoExclusaoUsuario() {
  usuarioExcluindoId = null;

  document.getElementById("excluirUsuarioContainer").classList.add("hidden");
  document.getElementById("excluirUsuarioOverlay").classList.add("hidden");
}

async function confirmarExclusaoUsuario() {
  if (usuarioExcluindoId === null) {
    mostrarAlerta("Nenhum usuário selecionado para inativação.");
    return;
  }

  try {
    await inativarUsuarioApi(usuarioExcluindoId);

    await carregarTabelaUsuarios();

    fecharConfirmacaoExclusaoUsuario();

    mostrarAlerta("Usuário inativado com sucesso.");
  } catch (erro) {
    console.error(erro);
    mostrarAlerta(erro.message);
  }
}

function filtrarUsuarios() {
  const campoBusca = document.getElementById("buscaUsuario");

  if (!campoBusca) {
    return;
  }

  const termoBusca = campoBusca.value.toLowerCase();

  const usuariosFiltrados = usuariosCarregados.filter(function (usuario) {
    const nomePerfil = obterNomePerfilUsuario(usuario.id).toLowerCase();

    return (
      usuario.nome.toLowerCase().includes(termoBusca) ||
      usuario.matricula.toLowerCase().includes(termoBusca) ||
      usuario.email.toLowerCase().includes(termoBusca) ||
      nomePerfil.includes(termoBusca)
    );
  });

  renderizarTabelaUsuarios(usuariosFiltrados);
}

const formUsuario = document.getElementById("formUsuario");

if (formUsuario) {
  formUsuario.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nome = document.getElementById("nomeUsuarioInput").value.trim();
    const matricula = document.getElementById("matriculaUsuario").value.trim();
    const email = document.getElementById("emailUsuario").value.trim();
    const senha = document.getElementById("senhaUsuario").value;
    const perfilId = document.getElementById("perfilUsuario").value;
    const lojaId = document.getElementById("lojaUsuario").value || null;

    if (!nome) {
      mostrarAlerta("Informe o nome do usuário.");
      return;
    }

    if (!matricula) {
      mostrarAlerta("Informe a matrícula do usuário.");
      return;
    }

    if (!email) {
      mostrarAlerta("Informe o e-mail do usuário.");
      return;
    }

    if (!perfilId) {
      mostrarAlerta("Selecione um perfil de acesso.");
      return;
    }

    if (usuarioEditandoId === null && !senha) {
      mostrarAlerta("Informe a senha do usuário.");
      return;
    }

    const botaoSalvar = document.getElementById("btnSalvarUsuario");
    const textoOriginal = botaoSalvar.textContent;

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    try {
      if (usuarioEditandoId === null) {
        const usuarioCriado = await criarUsuarioApi({
          nome,
          matricula,
          email,
          senha,
        });

        await vincularPerfilAoUsuario(usuarioCriado.id, perfilId);
        await vincularLojaAoUsuario(usuarioCriado.id, lojaId);

        mostrarAlerta(
          "Usuário cadastrado com perfil e loja vinculados com sucesso.",
        );
      } else {
        await atualizarUsuarioApi(usuarioEditandoId, {
          nome,
          matricula,
          email,
        });

        await atualizarPerfilDoUsuario(usuarioEditandoId, perfilId);
        await vincularLojaAoUsuario(usuarioEditandoId, lojaId);

        mostrarAlerta(
          "Usuário atualizado com perfil e loja vinculados com sucesso.",
        );
      }

      await carregarTabelaUsuarios();

      fecharFormularioUsuario();
    } catch (erro) {
      console.error(erro);
      mostrarAlerta(erro.message);
    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = textoOriginal;
      usuarioEditandoId = null;
    }
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  carregarUsuarioLogado();

  await carregarPerfisNoFormulario();
  await carregarLojasNoFormulario();
  await carregarTabelaUsuarios();

  if (typeof aplicarPermissoesMenu === "function") {
    aplicarPermissoesMenu();
  }
});
