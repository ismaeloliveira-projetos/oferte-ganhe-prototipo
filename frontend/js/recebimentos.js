function carregarUsuarioLogado() {
    const ususarioSalvo = localStorage.getItem('usuarioLogado');
    if (!ususarioSalvo) {
        window.location.href = 'login.html';
        return;
    }
    const usuario = JSON.parse(ususarioSalvo);
    document.getElementById('nomeUsuario').textContent = usuario.nome;
}

function buscarLojasPorCodigo(codigo) {
    return lojasMockadas.find(function(loja) {
        return loja.codigo === codigo;
    });
}

function buscarEnvioPorId(idEnvio) {
    return enviosMockados.find(function(envio) {
        return envio.id === idEnvio;
    });
}

function obterClasseStatusRecebimento(status) {
    if (status === "Pendente") {
        return "badge-atencao";
    } 
    if (status === "Divergente") {
        return "badge-critico";
    }
    return "badge-normal";
}

function carregarCardsRecebimentos() {
    const totalRecebimentos = recebimentosMockados.length;
    const totalTaloesRecebidos = recebimentosMockados.reduce(function(total, recebimento) {
        return total + recebimento.quantidadeRecebida;
    }, 0);
    const recebimentosPendentes = recebimentosMockados.filter(function(recebimento) {
        return recebimento.status === "Pendente";
    }).length;
    const recebimentosDivergentes = recebimentosMockados.filter(function(recebimento) {
        return recebimento.status === "Divergente";
    }).length;

    document.getElementById(
        "totalRecebimentos").textContent = totalRecebimentos;
    document.getElementById("totalTaloesRecebidos").textContent = totalTaloesRecebidos;
    document.getElementById("recebimentosPendentes").textContent = recebimentosPendentes;
    document.getElementById("recebimentosDivergentes").textContent = recebimentosDivergentes;
}

function carregarTabelaRecebimentos() {
    const tabela = document.getElementById('tabelaRecebimentos');
    tabela.innerHTML = '';
    recebimentosMockados.forEach(function(recebimento) {
        const loja = buscarLojasPorCodigo(recebimento.codigoLoja);
        const envio = buscarEnvioPorId(recebimento.idEnvio);
        const classeStatus = obterClasseStatusRecebimento(recebimento.status);
        tabela.innerHTML += `<tr>
            <td>${recebimento.dataHora}</td>
            <td>${loja ? loja.nome : recebimento.codigoLoja}</td>
            <td>${envio ? envio.quantidade : 'N/A'}</td>
            <td>${recebimento.quantidadeRecebida}</td>
            <td>${recebimento.responsavel}</td>
            <td><span class="badge-status ${classeStatus}">${recebimento.status}</span></td>
            <td><button class="btn-table-action btn-primary">Ver Detalhes</button></td>
        </tr>`;
    });

}

function abrirMenuMobile() {
    document.getElementById("sidebar").classList.add("open");
        document.getElementById("menuOverlay").classList.add("open");
}

function fecharMenuMobile() {   
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("menuOverlay").classList.remove("open");
}

carregarUsuarioLogado();
carregarCardsRecebimentos();
carregarTabelaRecebimentos();
aplicarResponsividadeTabelas();