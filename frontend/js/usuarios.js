const API_USUARIOS_URL = "/api/usuarios";
const API_PERFIS_URL = "/api/perfis";
const API_LOJAS_URL = "/api/lojas";

let usuarioEditandoId = null;
let usuarioExcluindoId = null;

let usuariosCarregados = [];
let perfisDisponiveis = [];
let lojasDisponiveis = [];
let perfisPorUsuario = {};
let lojasPorUsuario = {};

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

async function buscarApi(caminho, opcoes = {}) {
  return await apiFetch(caminho, opcoes);
}

async function enviarApi(caminho, metodo, dados = null) {
  const opcoes = {
    method: metodo,
  };

  if (dados !== null) {
    opcoes.body = JSON.stringify(dados);
  }

  return await apiFetch(caminho, opcoes);
}

function normalizarUsuario(usuario) {
  return {
    id: usuario.id ?? usuario.idUsuario ?? usuario.id_usuario,
    nome: usuario.nome ?? usuario.nomeUsuario ?? usuario.nome_usuario ?? "-",
    matricula: usuario.matricula ?? "-",
    email: usuario.email ?? "-",
    ativo: usuario.ativo,
  };
}

function normalizarPerfil(perfil) {
  return {
    id: perfil.id ?? perfil.perfilId ?? perfil.idPerfil ?? perfil.id_perfil,
    perfilId:
      perfil.perfilId ?? perfil.id ?? perfil.idPerfil ?? perfil.id_perfil,
    nomePerfil:
      perfil.nomePerfil ??
      perfil.nome_perfil ??
      perfil.nome ??
      perfil.descricao ??
      "Perfil",
  };
}

function normalizarLoja(loja) {
  return {
    id: loja.id ?? loja.lojaId ?? loja.idLoja ?? loja.id_loja,
    codigoLoja:
      loja.codigoLoja ?? loja.codigo_loja ?? loja.codigo ?? loja.codigoLoja,
    nomeLoja: loja.nomeLoja ?? loja.nome_loja ?? loja.nome ?? loja.nomeLoja,
  };
}

async function criarUsuarioApi(dados) {
  return await enviarApi(API_USUARIOS_URL, "POST", dados);
}

async function atualizarUsuarioApi(id, dados) {
  return await enviarApi(`${API_USUARIOS_URL}/${id}`, "PUT", dados);
}

async function inativarUsuarioApi(id) {
  return await enviarApi(`${API_USUARIOS_URL}/${id}/inativar`, "PATCH");
}

async function buscarPerfisDoUsuario(usuarioId) {
  try {
    const resposta = await buscarApi(`${API_PERFIS_URL}/usuarios/${usuarioId}`);

    if (!Array.isArray(resposta)) {
      return [];
    }

    return resposta.map(normalizarPerfil);
  } catch (erro) {
    console.warn("Perfil do usuário não encontrado:", usuarioId, erro.message);
    return [];
  }
}

async function vincularPerfilAoUsuario(usuarioId, perfilId) {
  return await enviarApi(`${API_PERFIS_URL}/usuarios/${usuarioId}`, "POST", {
    perfilId: Number(perfilId),
  });
}

async function removerPerfilDoUsuario(usuarioId, perfilId) {
  return await enviarApi(
    `${API_PERFIS_URL}/usuarios/${usuarioId}/${perfilId}`,
    "DELETE",
  );
}

async function atualizarPerfilDoUsuario(usuarioId, novoPerfilId) {
  const perfisAtuais = await buscarPerfisDoUsuario(usuarioId);

  for (const perfil of perfisAtuais) {
    await removerPerfilDoUsuario(usuarioId, perfil.perfilId);
  }

  await vincularPerfilAoUsuario(usuarioId, novoPerfilId);
}

async function buscarLojasDoUsuario(usuarioId) {
  try {
    const resposta = await buscarApi(`${API_USUARIOS_URL}/${usuarioId}/lojas`);

    return {
      usuarioId,
      escopo: resposta.escopo || "LOJAS_ESPECIFICAS",
      lojas: Array.isArray(resposta.lojas)
        ? resposta.lojas.map(normalizarLoja)
        : [],
    };
  } catch (erro) {
    console.warn("Lojas do usuário não encontradas:", usuarioId, erro.message);

    return {
      usuarioId,
      escopo: "TODAS_AS_LOJAS",
      lojas: [],
    };
  }
}

async function vincularLojaAoUsuario(usuarioId, lojaId) {
  return await enviarApi(`${API_USUARIOS_URL}/${usuarioId}/lojas`, "POST", {
    lojaId: lojaId ? Number(lojaId) : null,
  });
}

function obterIdUsuarioCriado(resposta) {
  return (
    resposta.id ??
    resposta.usuario?.id ??
    resposta.usuarioId ??
    resposta.idUsuario ??
    resposta.id_usuario
  );
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

async function carregarPerfisDosUsuarios(usuarios) {
  perfisPorUsuario = {};

  await Promise.all(
    usuarios.map(async function (usuario) {
      const perfis = await buscarPerfisDoUsuario(usuario.id);
      perfisPorUsuario[usuario.id] = perfis;
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
      return `${loja.codigoLoja || "-"} - ${loja.nomeLoja || "-"}`;
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
    const perfis = await buscarApi(API_PERFIS_URL);

    perfisDisponiveis = Array.isArray(perfis)
      ? perfis.map(normalizarPerfil)
      : [];

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
    console.error("Erro ao carregar perfis:", erro);
    mostrarAlerta("Erro ao carregar perfis.", true);
  }
}

async function carregarLojasNoFormulario() {
  const selectLoja = document.getElementById("lojaUsuario");

  if (!selectLoja) {
    return;
  }

  try {
    const lojas = await buscarApi(API_LOJAS_URL);

    lojasDisponiveis = Array.isArray(lojas) ? lojas.map(normalizarLoja) : [];

    selectLoja.innerHTML = `
      <option value="">Administrador Geral (Todas as lojas)</option>
    `;

    lojasDisponiveis.forEach(function (loja) {
      selectLoja.innerHTML += `
        <option value="${loja.id}">
          ${loja.codigoLoja || "-"} - ${loja.nomeLoja || "-"}
        </option>
      `;
    });
  } catch (erro) {
    console.error("Erro ao carregar lojas:", erro);
    mostrarAlerta("Erro ao carregar lojas.", true);
  }
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
        <td colspan="6" class="empty-state">
          Nenhum usuário cadastrado.
        </td>
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
        <td>
          <span class="badge-status badge-normal">
            ${nomePerfil}
          </span>
        </td>
        <td>${nomeLoja}</td>
        <td>
          <div class="table-actions">
            <button
              class="btn-table-action btn-sm"
              onclick="editarUsuario(${usuario.id})"
            >
              Editar
            </button>

            <button
              class="btn-tableaction btn-sm"
              onclick="excluirUsuario(${usuario.id})"
            >
              Inativar
            </button>
          </div>
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
      const resposta = await buscarApi(API_USUARIOS_URL);

      usuariosCarregados = Array.isArray(resposta)
        ? resposta.map(normalizarUsuario)
        : [];

      await carregarPerfisDosUsuarios(usuariosCarregados);
      await carregarLojasDosUsuarios(usuariosCarregados);

      renderizarTabelaUsuarios(usuariosCarregados);
      return;
    }

    renderizarTabelaUsuarios(listaUsuarios);
  } catch (erro) {
    console.error("Erro ao carregar usuários:", erro);

    tabela.innerHTML = `
      <tr>
        <td colspan="6">Erro ao carregar usuários.</td>
      </tr>
    `;

    mostrarAlerta("Erro ao carregar usuários.", true);
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
    return Number(usuario.id) === Number(id);
  });

  if (!usuarioEncontrado) {
    mostrarAlerta("Usuário não encontrado.", true);
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

  const selectPerfil = document.getElementById("perfilUsuario");

  if (selectPerfil) {
    selectPerfil.value = obterPrimeiroPerfilIdUsuario(usuarioEncontrado.id);
  }

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
    return Number(usuario.id) === Number(id);
  });

  if (!usuarioEncontrado) {
    mostrarAlerta("Usuário não encontrado.", true);
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
    mostrarAlerta("Nenhum usuário selecionado para inativação.", true);
    return;
  }

  try {
    await inativarUsuarioApi(usuarioExcluindoId);

    await carregarTabelaUsuarios();

    fecharConfirmacaoExclusaoUsuario();

    mostrarAlerta("Usuário inativado com sucesso.");
  } catch (erro) {
    console.error("Erro ao inativar usuário:", erro);
    mostrarAlerta(erro.message, true);
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
      String(usuario.matricula).toLowerCase().includes(termoBusca) ||
      usuario.email.toLowerCase().includes(termoBusca) ||
      nomePerfil.includes(termoBusca)
    );
  });

  renderizarTabelaUsuarios(usuariosFiltrados);
}

async function salvarUsuario(event) {
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
  const textoOriginal = botaoSalvar ? botaoSalvar.textContent : "Salvar";

  if (botaoSalvar) {
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
  }

  try {
    if (usuarioEditandoId === null) {
      const usuarioCriado = await criarUsuarioApi({
        nome,
        matricula,
        email,
        senha,
      });

      const usuarioCriadoId = obterIdUsuarioCriado(usuarioCriado);

      if (!usuarioCriadoId) {
        throw new Error("Usuário criado, mas o backend não retornou o ID.");
      }

      await vincularPerfilAoUsuario(usuarioCriadoId, perfilId);
      await vincularLojaAoUsuario(usuarioCriadoId, lojaId);

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
    console.error("Erro ao salvar usuário:", erro);
    mostrarAlerta(erro.message, true);
  } finally {
    if (botaoSalvar) {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = textoOriginal;
    }

    usuarioEditandoId = null;
  }
}

async function iniciarPaginaUsuarios() {
  const usuario = carregarUsuarioLogado();

  if (!usuario) {
    return;
  }

  const formUsuario = document.getElementById("formUsuario");

  if (formUsuario) {
    formUsuario.addEventListener("submit", salvarUsuario);
  }

  await carregarPerfisNoFormulario();
  await carregarLojasNoFormulario();
  await carregarTabelaUsuarios();

  if (typeof aplicarPermissoesMenu === "function") {
    aplicarPermissoesMenu();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarPaginaUsuarios();
});
