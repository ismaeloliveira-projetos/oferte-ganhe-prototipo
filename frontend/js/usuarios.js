let usuarioEditandoId = null;
let usuarioExcluindoId = null;

function buscarUsuariosSalvos() {
  const banco = carregarBanco();
  return banco.usuarios || [];
}

function buscarPerfisSalvos() {
  const banco = carregarBanco();
  return banco.perfis || [];
}

function buscarLojasSalvas() {
  const banco = carregarBanco();
  return banco.lojas || [];
}

function salvarUsuarios(usuarios) {
  const banco = carregarBanco();
  banco.usuarios = usuarios;
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

function obterNomePerfil(perfilId) {
  const perfis = buscarPerfisSalvos();
  const perfilEncontrado = perfis.find((perfil) => perfil.id === perfilId);
  return perfilEncontrado ? perfilEncontrado.nome : "Sem perfil";
}

function obterNomeLoja(codigoLoja) {
  if (!codigoLoja) return "Geral (Todas)";
  const lojas = buscarLojasSalvas();
  const lojaEncontrada = lojas.find((loja) => loja.codigo === codigoLoja);
  return lojaEncontrada ? lojaEncontrada.nome : "Loja desconhecida";
}

function carregarPerfisNoFormulario() {
  const selectPerfil = document.getElementById("perfilUsuario");
  const perfis = buscarPerfisSalvos();
  if (!selectPerfil) return;
  selectPerfil.innerHTML = "";
  perfis.forEach((perfil) => {
    selectPerfil.innerHTML += `<option value="${perfil.id}">${perfil.nome}</option>`;
  });
}

function carregarLojasNoFormulario() {
  const selectLoja = document.getElementById("lojaUsuario");
  const lojas = buscarLojasSalvas();
  if (!selectLoja) return;
  selectLoja.innerHTML = `<option value="">Administrador Geral (Todas as lojas)</option>`;
  lojas.forEach((loja) => {
    selectLoja.innerHTML += `<option value="${loja.codigo}">${loja.codigo} - ${loja.nome}</option>`;
  });
}

function carregarTabelaUsuarios(listaUsuarios) {
  const tabela = document.getElementById("tabelaUsuarios");
  if (!tabela) return;

  tabela.innerHTML = "";
  const usuarioLogado = buscarUsuarioLogado();
  const usuarios = listaUsuarios || buscarUsuariosSalvos();

  usuarios.forEach(function (usuario) {
    const nomePerfil = obterNomePerfil(usuario.perfilId);
    const nomeLoja = obterNomeLoja(usuario.lojaId);
    const podeEditar = podeGerenciar(usuarioLogado, usuario);

    const botaoEditar = podeEditar
      ? `<button class="btn-table-action btn-sm" onclick="window.editarUsuario(${usuario.id})">Editar</button>`
      : "";
    const botaoExcluir = podeEditar
      ? `<button class="btn-table-action btn-sm" onclick="window.excluirUsuario(${usuario.id})">Excluir</button>`
      : "";

    tabela.innerHTML += `
      <tr>
        <td>${usuario.nome}</td>
        <td>${usuario.matricula}</td>
        <td>${usuario.email}</td>
        <td><span class="badge badge-normal">${nomePerfil}</span></td>
        <td>${nomeLoja}</td>
        <td>${botaoEditar} ${botaoExcluir}</td>
      </tr>
    `;
  });

  aplicarResponsividadeTabelas();
}

function abrirFormularioUsuario() {
  usuarioEditandoId = null;
  const form = document.getElementById("formUsuario");
  if (form) form.reset();
  carregarPerfisNoFormulario();
  carregarLojasNoFormulario();
  const btnSalvar = document.getElementById("btnSalvarUsuario");
  if (btnSalvar) btnSalvar.textContent = "Salvar Usuário";

  const container = document.getElementById("formUsuarioContainer");
  const overlay = document.getElementById("formUsuarioOverlay");
  if (container) container.classList.remove("hidden");
  if (overlay) overlay.classList.remove("hidden");
}

function fecharFormularioUsuario() {
  const container = document.getElementById("formUsuarioContainer");
  const overlay = document.getElementById("formUsuarioOverlay");
  if (container) container.classList.add("hidden");
  if (overlay) overlay.classList.add("hidden");
}

window.editarUsuario = function (id) {
  try {
    const usuarioLogado = buscarUsuarioLogado();
    const usuarios = buscarUsuariosSalvos();
    const usuarioEncontrado = usuarios.find((usuario) => usuario.id === id);

    if (!usuarioEncontrado) {
      mostrarAlerta("Usuário não encontrado.");
      return;
    }

    if (!podeGerenciar(usuarioLogado, usuarioEncontrado)) {
      mostrarAlerta("Você não tem permissão para editar este usuário.");
      return;
    }

    usuarioEditandoId = id;
    carregarPerfisNoFormulario();
    carregarLojasNoFormulario();

    const inputNome = document.getElementById("nomeUsuarioInput");
    const inputMatricula = document.getElementById("matriculaUsuario");
    const inputEmail = document.getElementById("emailUsuario");
    const inputSenha = document.getElementById("senhaUsuario");
    const selectPerfil = document.getElementById("perfilUsuario");
    const selectLoja = document.getElementById("lojaUsuario");
    const btnSalvar = document.getElementById("btnSalvarUsuario");

    if (inputNome) inputNome.value = usuarioEncontrado.nome;
    if (inputMatricula) inputMatricula.value = usuarioEncontrado.matricula;
    if (inputEmail) inputEmail.value = usuarioEncontrado.email;
    if (inputSenha) inputSenha.value = usuarioEncontrado.senha;
    if (selectPerfil) selectPerfil.value = usuarioEncontrado.perfilId;
    if (selectLoja) selectLoja.value = usuarioEncontrado.lojaId || "";
    if (btnSalvar) btnSalvar.textContent = "Atualizar Usuário";

    const container = document.getElementById("formUsuarioContainer");
    const overlay = document.getElementById("formUsuarioOverlay");
    if (container) container.classList.remove("hidden");
    if (overlay) overlay.classList.remove("hidden");
  } catch (erro) {
    console.error("Erro em editarUsuario:", erro);
    mostrarAlerta("Erro ao abrir formulário de edição");
  }
};

window.excluirUsuario = function (id) {
  try {
    const usuarioLogado = buscarUsuarioLogado();
    const usuarios = buscarUsuariosSalvos();
    const usuarioEncontrado = usuarios.find((usuario) => usuario.id === id);

    if (!usuarioEncontrado) {
      mostrarAlerta("Usuário não encontrado.");
      return;
    }

    if (!podeGerenciar(usuarioLogado, usuarioEncontrado)) {
      mostrarAlerta("Você não tem permissão para excluir este usuário.");
      return;
    }

    usuarioExcluindoId = id;
    const nome = document.getElementById("nomeUsuarioExclusao");
    const email = document.getElementById("emailUsuarioExclusao");

    if (nome) nome.textContent = usuarioEncontrado.nome;
    if (email) email.textContent = usuarioEncontrado.email;

    const container = document.getElementById("excluirUsuarioContainer");
    const overlay = document.getElementById("excluirUsuarioOverlay");
    if (container) container.classList.remove("hidden");
    if (overlay) overlay.classList.remove("hidden");
  } catch (erro) {
    console.error("Erro em excluirUsuario:", erro);
    mostrarAlerta("Erro ao abrir confirmação de exclusão");
  }
};

function fecharConfirmacaoExclusaoUsuario() {
  usuarioExcluindoId = null;
  const container = document.getElementById("excluirUsuarioContainer");
  const overlay = document.getElementById("excluirUsuarioOverlay");
  if (container) container.classList.add("hidden");
  if (overlay) overlay.classList.add("hidden");
}

function confirmarExclusaoUsuario() {
  if (usuarioExcluindoId === null) {
    mostrarAlerta("Nenhum usuário selecionado para exclusão.");
    return;
  }

  const usuarios = buscarUsuariosSalvos();
  const usuariosAtualizados = usuarios.filter(
    (usuario) => usuario.id !== usuarioExcluindoId,
  );

  salvarUsuarios(usuariosAtualizados);
  carregarTabelaUsuarios();
  fecharConfirmacaoExclusaoUsuario();
  mostrarAlerta("Usuário excluído com sucesso.");
}

function filtrarUsuarios() {
  const termoBusca = document
    .getElementById("buscaUsuario")
    .value.toLowerCase();
  const usuarios = buscarUsuariosSalvos();

  const usuariosFiltrados = usuarios.filter(
    (usuario) =>
      usuario.nome.toLowerCase().includes(termoBusca) ||
      usuario.matricula.toLowerCase().includes(termoBusca) ||
      usuario.email.toLowerCase().includes(termoBusca),
  );

  carregarTabelaUsuarios(usuariosFiltrados);
}

const formUsuario = document.getElementById("formUsuario");
if (formUsuario) {
  formUsuario.addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nomeUsuarioInput").value;
    const matricula = document.getElementById("matriculaUsuario").value;
    const email = document.getElementById("emailUsuario").value;
    const senha = document.getElementById("senhaUsuario").value;
    const perfilId = Number(document.getElementById("perfilUsuario").value);
    const lojaId = document.getElementById("lojaUsuario").value || null;

    const usuarios = buscarUsuariosSalvos();

    if (usuarioEditandoId === null) {
      const novoUsuario = {
        id: Date.now(),
        nome: nome,
        matricula: matricula,
        email: email,
        senha: senha,
        perfilId: perfilId,
        lojaId: lojaId,
      };

      usuarios.push(novoUsuario);
      salvarUsuarios(usuarios);
      mostrarAlerta("Usuário cadastrado com sucesso.");
    } else {
      const usuariosAtualizados = usuarios.map((usuario) => {
        if (usuario.id === usuarioEditandoId) {
          return {
            ...usuario,
            nome: nome,
            matricula: matricula,
            email: email,
            senha: senha,
            perfilId: perfilId,
            lojaId: lojaId,
          };
        }
        return usuario;
      });

      salvarUsuarios(usuariosAtualizados);
      mostrarAlerta("Usuário atualizado com sucesso.");
    }

    carregarTabelaUsuarios();
    fecharFormularioUsuario();
    usuarioEditandoId = null;
    const btnSalvar = document.getElementById("btnSalvarUsuario");
    if (btnSalvar) btnSalvar.textContent = "Salvar Usuário";
  });
}

carregarUsuarioLogado();
carregarTabelaUsuarios();
aplicarPermissoesMenu();
