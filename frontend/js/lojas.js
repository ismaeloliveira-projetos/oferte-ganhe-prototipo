function carregarUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
        window.location.href = 'login.html';
        return;
}
    const usuario = JSON.parse(usuarioSalvo);
    document.getElementById("nomeUsuario").textContent = usuario.nome;
}

function obterStatusEstoque(loja) {
    if (loja.estoqueAtual <= loja.estoqueMinimo) {
        return "Crítico";
    }
    if (loja.estoqueAtual < loja.estoqueRecomendado) {
        return "Atenção";
    }
    return "Normal";
}

function obterClassesStatuas(status) {
    if (status === "Crítico") {
        return "badge-critico";
    }
    if (status === "Atenção") {
        return "badge-atencao";
    }
    return "badge-normal";
}

function carregarCardsLojas() {
    const totalLojas = lojasMockadas.length;
    
    const lojasAtivas = lojasMockadas.length; 

    const LojasCriticas = lojasMockadas.filter(function(loja) {
        return obterStatusEstoque(loja) === "Crítico";
    }).length;

    const lojasAtencao = lojasMockadas.filter(function(loja) {
        return obterStatusEstoque(loja) === "Atenção";
    }).length;

    document.getElementById("totalLojas").textContent = totalLojas;
    document.getElementById("lojasAtivas").textContent = lojasAtivas;
    document.getElementById("lojasCriticas").textContent = LojasCriticas;
    document.getElementById("lojasAtencao").textContent = lojasAtencao;

}

function carregarTabelaLojas() {
    const tabela = document.getElementById("tabelaLojas");
    tabela.innerHTML = "";

    lojasMockadas.forEach(function(loja) {
        const status = obterStatusEstoque(loja);
        const classesStatus = obterClassesStatuas(status);  

        tabela.innerHTML += `
            <tr>
                <td>${loja.codigo}</td>
                <td>${loja.nome}</td>
                <td>${loja.estoqueAtual}</td>
                <td>${loja.estoqueMinimo}</td>
                <td>${loja.estoqueRecomendado}</td>
                <td>
                    <span class="badge ${classesStatus}">${status}</span>
                </td>
                <td>
                    <button class="btn btn-action" btn-sm">Visualizar</button>
                </td>
            </tr>
        `;
    });
}


carregarUsuarioLogado();
carregarCardsLojas();
carregarTabelaLojas();
