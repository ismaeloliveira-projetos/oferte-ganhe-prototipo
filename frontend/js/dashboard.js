function buscarLojasSalvas() {
    const banco = carregarBanco();

    if (!banco.lojas) {
        banco.lojas = [];
        salvarBanco(banco);
    }

    return banco.lojas;
}

function buscarEnviosSalvos() {
    const banco = carregarBanco();

    if (!banco.envios) {
        banco.envios = [];
        salvarBanco(banco);
    }

    return banco.envios;
}

function buscarRecebimentosSalvos() {
    const banco = carregarBanco();

    if (!banco.recebimentos) {
        banco.recebimentos = [];
        salvarBanco(banco);
    }

    return banco.recebimentos;
}

function buscarManutencoesSalvas() {
    const banco = carregarBanco();

    if (!banco.manutencoes) {
        banco.manutencoes = [];
        salvarBanco(banco);
    }

    return banco.manutencoes;
}

function obterEstoqueAtual(loja) {
    return Number(
        loja.estoqueAtual ??
        loja.quantidadeAtual ??
        loja.recomendado ??
        loja.estoqueRecomendado ??
        0
    );
}

function obterEstoqueMinimo(loja) {
    return Number(
        loja.estoqueMinimo ??
        loja.minimo ??
        0
    );
}

function obterEstoqueRecomendado(loja) {
    return Number(
        loja.estoqueRecomendado ??
        loja.recomendado ??
        0
    );
}

function obterStatusEstoque(loja) {
    const estoqueAtual = obterEstoqueAtual(loja);
    const estoqueMinimo = obterEstoqueMinimo(loja);
    const estoqueRecomendado = obterEstoqueRecomendado(loja);

    if (estoqueAtual <= estoqueMinimo) {
        return "Crítico";
    }

    if (estoqueAtual < estoqueRecomendado) {
        return "Atenção";
    }

    return "Normal";
}

function obterClasseStatus(status) {
    if (status === "Crítico") {
        return "badge-critico";
    }

    if (status === "Atenção") {
        return "badge-atencao";
    }

    return "badge-normal";
}

function envioEhDoMesAtual(envio) {
    const dataEnvio = new Date(envio.dataHora);

    if (isNaN(dataEnvio.getTime())) {
        return false;
    }

    const hoje = new Date();

    return (
        dataEnvio.getMonth() === hoje.getMonth() &&
        dataEnvio.getFullYear() === hoje.getFullYear()
    );
}

function obterQuantidadeEnvio(envio) {
    return Number(
        envio.quantidade ??
        envio.quantidadeEnviada ??
        envio.quantidade_enviada ??
        0
    );
}

function carregarCardsDashboard() {
    const lojas = buscarLojasSalvas();
    const envios = buscarEnviosSalvos();

    const totalLojas = lojas.length;

    const totalEstoque = lojas.reduce(function(total, loja) {
        return total + obterEstoqueAtual(loja);
    }, 0);

    const lojasCriticas = lojas.filter(function(loja) {
        return obterStatusEstoque(loja) === "Crítico";
    }).length;

    const enviosMes = envios.filter(function(envio) {
        return envioEhDoMesAtual(envio);
    }).length;

    document.getElementById("totalLojas").textContent = totalLojas;
    document.getElementById("totalEstoque").textContent = totalEstoque;
    document.getElementById("lojasCriticas").textContent = lojasCriticas;
    document.getElementById("enviosMes").textContent = enviosMes;
}

function carregarTabelaLojasCriticas() {
    const tabela = document.getElementById("tabelaLojasCriticas");

    if (!tabela) {
        return;
    }

    const lojas = buscarLojasSalvas();

    const lojasComAtencao = lojas.filter(function(loja) {
        const status = obterStatusEstoque(loja);

        return status === "Crítico" || status === "Atenção";
    });

    tabela.innerHTML = "";

    if (lojasComAtencao.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="6">Nenhuma loja em situação crítica ou de atenção.</td>
            </tr>
        `;
        return;
    }

    lojasComAtencao.forEach(function(loja) {
        const status = obterStatusEstoque(loja);
        const classeStatus = obterClasseStatus(status);

        tabela.innerHTML += `
            <tr>
                <td>${loja.codigo || "-"}</td>
                <td>${loja.nome || "Loja sem nome"}</td>
                <td>${obterEstoqueAtual(loja)}</td>
                <td>${obterEstoqueMinimo(loja)}</td>
                <td>${obterEstoqueRecomendado(loja)}</td>
                <td>
                    <span class="badge-status ${classeStatus}">
                        ${status}
                    </span>
                </td>
            </tr>
        `;
    });

    aplicarResponsividadeTabelas();
}

function carregarInsights() {
    const lista = document.getElementById("listaInsights");

    if (!lista) {
        return;
    }

    const lojas = buscarLojasSalvas();
    const envios = buscarEnviosSalvos();
    const recebimentos = buscarRecebimentosSalvos();
    const manutencoes = buscarManutencoesSalvas();

    const lojasCriticas = lojas.filter(function(loja) {
        return obterStatusEstoque(loja) === "Crítico";
    });

    const lojasAtencao = lojas.filter(function(loja) {
        return obterStatusEstoque(loja) === "Atenção";
    });

    const enviosPendentes = envios.filter(function(envio) {
        return envio.status === "Pendente";
    });

    const totalEnviado = envios.reduce(function(total, envio) {
        return total + obterQuantidadeEnvio(envio);
    }, 0);

    lista.innerHTML = "";

    if (lojasCriticas.length > 0) {
        lista.innerHTML += `
            <div class="insight-item">
                <strong>Estoque crítico:</strong>
                Existem ${lojasCriticas.length} loja(s) abaixo do estoque mínimo.
            </div>
        `;
    }

    if (lojasAtencao.length > 0) {
        lista.innerHTML += `
            <div class="insight-item">
                <strong>Atenção:</strong>
                Existem ${lojasAtencao.length} loja(s) abaixo do estoque recomendado.
            </div>
        `;
    }

    if (enviosPendentes.length > 0) {
        lista.innerHTML += `
            <div class="insight-item">
                <strong>Envios pendentes:</strong>
                Existem ${enviosPendentes.length} remessa(s) aguardando recebimento.
            </div>
        `;
    }

    lista.innerHTML += `
        <div class="insight-item">
            <strong>Movimentação:</strong>
            O sistema possui ${envios.length} envio(s), ${recebimentos.length} recebimento(s) e ${manutencoes.length} manutenção(ões).
        </div>
    `;

    lista.innerHTML += `
        <div class="insight-item">
            <strong>Total enviado:</strong>
            Foram registrados ${totalEnviado} talões enviados no sistema.
        </div>
    `;

    if (
        lojasCriticas.length === 0 &&
        lojasAtencao.length === 0 &&
        enviosPendentes.length === 0
    ) {
        lista.innerHTML += `
            <div class="insight-item">
                <strong>Situação estável:</strong>
                Nenhuma pendência crítica identificada no momento.
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    carregarCardsDashboard();
    carregarTabelaLojasCriticas();
    carregarInsights();
});