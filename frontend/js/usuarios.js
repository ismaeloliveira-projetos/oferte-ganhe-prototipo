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

function salvarUsuarios(usuarios) {
    const banco = carregarBanco();

    banco.usuarios = usuarios;

    salvarBanco(banco);
}

function mostrarAlerta(mensagem) {
    const alerta = document.getElementById("alertaSistema");

    alerta.textContent = mensagem;
    alerta.classList.remove("hidden");

    setTimeout(function() {
        alerta.classList.add("hidden");
    }, 3000);
}

function obterNomePerfil(perfilId) {
    const perfis = buscarPerfisSalvos();

    const perfilEncontrado = perfis.find(function(perfil) {
        return perfil.id === perfilId;
    });

    if (!perfilEncontrado) {
        return "Sem perfil";
    }

    return perfilEncontrado.nome;
}

function carregarPerfisNoFormulario() {
    const selectPerfil = document.getElementById("perfilUsuario");
    const perfis = buscarPerfisSalvos();

    selectPerfil.innerHTML = "";

    perfis.forEach(function(perfil) {
        selectPerfil.innerHTML += `
            <option value="${perfil.id}">
                ${perfil.nome}
            </option>
        `;
    });
}

function carregarTabelaUsuarios(listaUsuarios) {
    const tabela = document.getElementById("tabelaUsuarios");
    tabela.innerHTML = "";

    const usuarios = listaUsuarios || buscarUsuariosSalvos();

    usuarios.forEach(function(usuario) {
        const nomePerfil = obterNomePerfil(usuario.perfilId);

        tabela.innerHTML += `
            <tr>
                <td>${usuario.nome}</td>
                <td>${usuario.matricula}</td>
                <td>${usuario.email}</td>
                <td>
                    <span class="badge badge-normal">${nomePerfil}</span>
                </td>
                <td>
                    <button class="btn-table-action btn-sm" onclick="editarUsuario(${usuario.id})">
                        Editar
                    </button>

                    <button class="btn-table-action btn-sm" onclick="excluirUsuario(${usuario.id})">
                        Excluir
                    </button>
                </td>
            </tr>
        `;
    });

    aplicarResponsividadeTabelas();
}

function abrirFormularioUsuario() {
    usuarioEditandoId = null;

    document.getElementById("formUsuario").reset();

    carregarPerfisNoFormulario();

    document.getElementById("btnSalvarUsuario").textContent = "Salvar Usuário";

    document.getElementById("formUsuarioContainer").classList.remove("hidden");
    document.getElementById("formUsuarioOverlay").classList.remove("hidden");
}

function fecharFormularioUsuario() {
    document.getElementById("formUsuarioContainer").classList.add("hidden");
    document.getElementById("formUsuarioOverlay").classList.add("hidden");
}

function editarUsuario(id) {
    const usuarios = buscarUsuariosSalvos();

    const usuarioEncontrado = usuarios.find(function(usuario) {
        return usuario.id === id;
    });

    if (!usuarioEncontrado) {
        mostrarAlerta("Usuário não encontrado.");
        return;
    }

    usuarioEditandoId = id;

    carregarPerfisNoFormulario();

    document.getElementById("nomeUsuarioInput").value = usuarioEncontrado.nome;
    document.getElementById("matriculaUsuario").value = usuarioEncontrado.matricula;
    document.getElementById("emailUsuario").value = usuarioEncontrado.email;
    document.getElementById("senhaUsuario").value = usuarioEncontrado.senha;
    document.getElementById("perfilUsuario").value = usuarioEncontrado.perfilId;

    document.getElementById("btnSalvarUsuario").textContent = "Atualizar Usuário";

    document.getElementById("formUsuarioContainer").classList.remove("hidden");
    document.getElementById("formUsuarioOverlay").classList.remove("hidden");
}

function excluirUsuario(id) {
    const usuarios = buscarUsuariosSalvos();

    const usuarioEncontrado = usuarios.find(function(usuario) {
        return usuario.id === id;
    });

    if (!usuarioEncontrado) {
        mostrarAlerta("Usuário não encontrado.");
        return;
    }

    usuarioExcluindoId = id;

    document.getElementById("nomeUsuarioExclusao").textContent = usuarioEncontrado.nome;
    document.getElementById("emailUsuarioExclusao").textContent = usuarioEncontrado.email;

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

    const usuariosAtualizados = usuarios.filter(function(usuario) {
        return usuario.id !== usuarioExcluindoId;
    });

    salvarUsuarios(usuariosAtualizados);

    carregarTabelaUsuarios();

    fecharConfirmacaoExclusaoUsuario();

    mostrarAlerta("Usuário excluído com sucesso.");
}

function filtrarUsuarios() {
    const termoBusca = document.getElementById("buscaUsuario").value.toLowerCase();

    const usuarios = buscarUsuariosSalvos();

    const usuariosFiltrados = usuarios.filter(function(usuario) {
        return (
            usuario.nome.toLowerCase().includes(termoBusca) ||
            usuario.matricula.toLowerCase().includes(termoBusca) ||
            usuario.email.toLowerCase().includes(termoBusca)
        );
    });

    carregarTabelaUsuarios(usuariosFiltrados);
}

document.getElementById("formUsuario").addEventListener("submit", function(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeUsuarioInput").value;
    const matricula = document.getElementById("matriculaUsuario").value;
    const email = document.getElementById("emailUsuario").value;
    const senha = document.getElementById("senhaUsuario").value;
    const perfilId = Number(document.getElementById("perfilUsuario").value);

    const usuarios = buscarUsuariosSalvos();

    if (usuarioEditandoId === null) {
        const novoUsuario = {
            id: Date.now(),
            nome: nome,
            matricula: matricula,
            email: email,
            senha: senha,
            perfilId: perfilId
        };

        usuarios.push(novoUsuario);

        salvarUsuarios(usuarios);

        mostrarAlerta("Usuário cadastrado com sucesso.");
    } else {
        const usuariosAtualizados = usuarios.map(function(usuario) {
            if (usuario.id === usuarioEditandoId) {
                return {
                    ...usuario,
                    nome: nome,
                    matricula: matricula,
                    email: email,
                    senha: senha,
                    perfilId: perfilId
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