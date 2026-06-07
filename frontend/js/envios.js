function carregarUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");
    if (!usuarioSalvo) {
        window.location.href = "login.html";
        return;
    }
    const usuario = JSON.parse(usuarioSalvo);
    document.getElementById("nomeUsuario").textContent = usuario.nome;
}

function buscarLojaPorCodigo(codigoLoja) {
    return lojasMockadas.find(function(loja) {
        return loja.codigo === codigoLoja;
    });
}

function obterClasseStatusEnvio(status) {
    if (status === "Pendente") {
        return "badge-atencao";
    }
    if (status === "Recebido") {
        return "badge-normal";
    }
    return "badge-normal";
    }

function carregarCardsEnvios() {
const totalEnvios = enviosMockados.length;

const totalTalõesEnviados = enviosMockados.reduce(function(total, envio) {
    return total + envio.quantidade;
}, 0);

const enviosPendentes = enviosMockados.filter(function(envio) {
    return envio.status === "Pendente";
}).length;
const lojasAtendidas = new Set(enviosMockados.map(function(envio) {
    return envio.codigoLoja;
})).size;

document.getElementById("totalEnvios").textContent = totalEnvios;
document.getElementById("totalTaloesEnviados").textContent = totalTalõesEnviados;
document.getElementById("enviosPendentes").textContent = enviosPendentes;
document.getElementById("lojasAtendidas").textContent = lojasAtendidas;
}


function carregarTabelaEnvios() {
    const tabela = document.getElementById("tabelaEnvios");
    tabela.innerHTML = "";
    enviosMockados.forEach(function(envio) {
        const loja = buscarLojaPorCodigo(envio.codigoLoja);
        const classeStatus = obterClasseStatusEnvio(envio.status);
        tabela.innerHTML += `
            <tr>
                <td>${envio.dataHora}</td>
                <td>${loja ? loja.nome : "Loja Desconhecida"}</td>
                <td>${envio.quantidade}</td>
                <td>${envio.responsavel}</td>
                <td><span class="badge-status ${classeStatus}">${envio.status}</span></td>
                <td><button class="btn-table-action">Ver Detalhes</button></td>
            </tr>
        `;
    });
}







carregarUsuarioLogado();
carregarCardsEnvios();
carregarTabelaEnvios();

