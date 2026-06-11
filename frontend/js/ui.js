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
    const usuarioLogado = localStorage.getItem("usuarioLogado");

    if (!usuarioLogado) {
        window.location.href = "login.html";
        return;
    }

    const usuario = JSON.parse(usuarioLogado);

    const nomeUsuario = document.getElementById("nomeUsuario");

    if (nomeUsuario) {
        nomeUsuario.textContent = usuario.nome;
    }
}

function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
}