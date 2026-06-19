let usuarioEditandoId = null;
let usuarioExcluindoId = null;

function buscarUsuariosSalvos() {
  const banco = carregarBanco();
  return banco.usuarios;
}

function buscarPerfisSalvos() {
  const banco = carregarBanco();
  return banco.perfis;
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
  selectPerfil.innerHTML = "";
  perfis.forEach((perfil) => {
    selectPerfil.innerHTML += `<option value="${perfil.id}">${perfil.nome}</option>`;
  });
}

function carregarLojasNoFormulario() {
  const selectLoja = document.getElementById("lojaUsuario");
  const lojas = buscarLojasSalvas();
  selectLoja.innerHTML = `<option value="">Administrador Geral (Todas as lojas)</option>`;
  lojas.forEach((loja) => {
    selectLoja.innerHTML += `<option value="${loja.codigo}">${loja.codigo} - ${loja.nome}</option>`;
  });
}

function carregarTabelaUsuarios(listaUsuarios) {
  const tabela = document.getElementById("tabelaUsuarios");
  tabela.innerHTML = "";
  const usuarioLogado = buscarUsuarioLogado();
  const usuarios = listaUsuarios || buscarUsuariosSalvos();

  usuarios.forEach(function (usuario) {
    const nomePerfil = obterNomePerfil(usuario.perfilId);
    const nomeLoja = obterNomeLoja(usuario.lojaId);
    const podeEditar = podeGerenciar(usuarioLogado, usuario);

    const botaoEditar = podeEditar
      ? `<button class="btn-table-action btn-sm" onclick="editarUsuario(${usuario.id})">Editar</button>`
      : "";
    const botaoExcluir = podeEditar
      ? `<button class="btn-table-action btn-sm" onclick="excluirUsuario(${usuario.id})">Excluir</button>`
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
  document.getElementById("formUsuario").reset();
  carregarPerfisNoFormulario();
  carregarLojasNoFormulario();
  document.getElementById("btnSalvarUsuario").textContent = "Salvar Usuário";
  document.getElementById("formUsuarioContainer").classList.remove("hidden");
  document.getElementById("formUsuarioOverlay").classList.remove("hidden");
}

function fecharFormularioUsuario() {
  document.getElementById("formUsuarioContainer").classList.add("hidden");
  document.getElementById("formUsuarioOverlay").classList.add("hidden");
}

function editarUsuario(id) {
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

  document.getElementById("nomeUsuarioInput").value = usuarioEncontrado.nome;
  document.getElementById("matriculaUsuario").value =
    usuarioEncontrado.matricula;
  document.getElementById("emailUsuario").value = usuarioEncontrado.email;
  document.getElementById("senhaUsuario").value = usuarioEncontrado.senha;
  document.getElementById("perfilUsuario").value = usuarioEncontrado.perfilId;
  document.getElementById("lojaUsuario").value = usuarioEncontrado.lojaId || "";

  document.getElementById("btnSalvarUsuario").textContent = "Atualizar Usuário";
  document.getElementById("formUsuarioContainer").classList.remove("hidden");
  document.getElementById("formUsuarioOverlay").classList.remove("hidden");
}

function excluirUsuario(id) {
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

document
  .getElementById("formUsuario")
  .addEventListener("submit", function (event) {
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
    document.getElementById("btnSalvarUsuario").textContent = "Salvar Usuário";
  });

carregarUsuarioLogado();
carregarTabelaUsuarios();
