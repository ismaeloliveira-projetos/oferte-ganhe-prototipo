function aplicarResponsividadeTabelas() {
    const tabelas = document.querySelectorAll(".responsive-table");
    tabelas.forEach(function(tabela) {
        const cabecalhos = tabela.querySelectorAll("thead th");
        const linhas = tabela.querySelectorAll("tbody tr");

        linhas.forEach(function(linha) {
            const colunas = linha.querySelectorAll("td");
            colunas.forEach(function(coluna, index) {
                if (cabecalhos[index]) {
                    coluna.setAttribute("data-label", cabecalhos[index].textContent);
                }
            });
        });
    });
}

function carregarUsuarioLogado() {
    const usuario = buscarUsuarioLogado();

    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const nomeUsuario = document.getElementById("nomeUsuario");

    if (nomeUsuario) {
        nomeUsuario.textContent = usuario.nome;
    }

    aplicarPermissoesMenu();
    protegerPaginaAtual();
}

function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
}

function abrirMenuMobile() {
    const sidebar = document.getElementById("sidebar");
    const menuOverlay = document.getElementById("menuOverlay");

    if (sidebar) {
        sidebar.classList.add("open");
    }

    if (menuOverlay) {
        menuOverlay.classList.add("open");
    }
}

function fecharMenuMobile() {
    const sidebar = document.getElementById("sidebar");
    const menuOverlay = document.getElementById("menuOverlay");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (menuOverlay) {
        menuOverlay.classList.remove("open");
    }
}

function buscarUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) {
        return null;
    }

    const usuario = JSON.parse(usuarioSalvo);

    if (Array.isArray(usuario)) {
        localStorage.removeItem("usuarioLogado");
        return null;
    }

    return usuario;
}

function aplicarPermissoesMenu() {
    const usuario = buscarUsuarioLogado();

    if (!usuario) {
        return;
    }

    const permissoes = usuario.permissoes || [];

    const linksProtegidos = document.querySelectorAll("[data-permissao]");

    linksProtegidos.forEach(function(link) {
        const permissaoNecessaria = link.getAttribute("data-permissao");

        if (!permissoes.includes(permissaoNecessaria)) {
            link.style.display = "none";
        } else {
            link.style.display = "flex";
        }
    });
}

function obterPermissaoPaginaAtual() {
    const paginaAtual = window.location.pathname.split("/").pop();

    const permissoesPorPagina = {
        "dashboard.html": "dashboard",
        "lojas.html": "lojas",
        "usuarios.html": "usuarios",
        "perfis.html": "perfis",
        "estoque.html": "estoque",
        "envios.html": "envios",
        "recebimentos.html": "recebimentos",
        "manutencao.html": "manutencao",
        "relatorios.html": "relatorios",
        "insights.html": "insights"
    };

    return permissoesPorPagina[paginaAtual];
}

function protegerPaginaAtual() {
    const usuario = buscarUsuarioLogado();

    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const permissoes = usuario.permissoes || [];
    const permissaoDaPagina = obterPermissaoPaginaAtual();

    if (!permissaoDaPagina) {
        return;
    }

    if (!permissoes.includes(permissaoDaPagina)) {
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "dashboard.html";
    }
}

function aplicarResponsividadeTabelas() {
    const tabelas = document.querySelectorAll(".responsive-table");
    tabelas.forEach(function(tabela) {
        const cabecalhos = tabela.querySelectorAll("thead th");
        const linhas = tabela.querySelectorAll("tbody tr");

        linhas.forEach(function(linha) {
            const colunas = linha.querySelectorAll("td");
            colunas.forEach(function(coluna, index) {
                if (cabecalhos[index]) {
                    coluna.setAttribute("data-label", cabecalhos[index].textContent);
                }
            });
        });
    });
}

function carregarUsuarioLogado() {
    const usuario = buscarUsuarioLogado();

    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const nomeUsuario = document.getElementById("nomeUsuario");

    if (nomeUsuario) {
        nomeUsuario.textContent = usuario.nome;
    }

    aplicarPermissoesMenu();
    protegerPaginaAtual();
}

function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
}

function abrirMenuMobile() {
    const sidebar = document.getElementById("sidebar");
    const menuOverlay = document.getElementById("menuOverlay");

    if (sidebar) {
        sidebar.classList.add("open");
    }

    if (menuOverlay) {
        menuOverlay.classList.add("open");
    }
}

function fecharMenuMobile() {
    const sidebar = document.getElementById("sidebar");
    const menuOverlay = document.getElementById("menuOverlay");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (menuOverlay) {
        menuOverlay.classList.remove("open");
    }
}

function buscarUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) {
        return null;
    }

    const usuario = JSON.parse(usuarioSalvo);

    if (Array.isArray(usuario)) {
        localStorage.removeItem("usuarioLogado");
        return null;
    }

    return usuario;
}

function aplicarPermissoesMenu() {
    const usuario = buscarUsuarioLogado();

    if (!usuario) {
        return;
    }

    const permissoes = usuario.permissoes || [];

    const linksProtegidos = document.querySelectorAll("[data-permissao]");

    linksProtegidos.forEach(function(link) {
        const permissaoNecessaria = link.getAttribute("data-permissao");

        if (!permissoes.includes(permissaoNecessaria)) {
            link.style.display = "none";
        }
    });
}

function obterPermissaoPaginaAtual() {
    const paginaAtual = window.location.pathname.split("/").pop();

    const permissoesPorPagina = {
        "dashboard.html": "dashboard",
        "lojas.html": "lojas",
        "usuarios.html": "usuarios",
        "perfis.html": "perfis",
        "estoque.html": "estoque",
        "envios.html": "envios",
        "recebimentos.html": "recebimentos",
        "manutencao.html": "manutencao",
        "relatorios.html": "relatorios",
        "insights.html": "insights"
    };

    return permissoesPorPagina[paginaAtual];
}

function protegerPaginaAtual() {
    const usuario = buscarUsuarioLogado();

    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const permissoes = usuario.permissoes || [];
    const permissaoDaPagina = obterPermissaoPaginaAtual();

    if (!permissaoDaPagina) {
        return;
    }

    if (!permissoes.includes(permissaoDaPagina)) {
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "dashboard.html";
    }
}