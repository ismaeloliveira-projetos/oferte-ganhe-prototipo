function buscarRecebimentosSalvos() {
    const banco = carregarBanco();

    if (!banco.recebimentos) {
        banco.recebimentos = [];
        salvarBanco(banco);
    }

    return banco.recebimentos;
}

function buscarEnviosSalvos() {
    const banco = carregarBanco();

    if (!banco.envios) {
        banco.envios = [];
        salvarBanco(banco);
    }

    return banco.envios;
}

function buscarLojasSalvas() {
    const banco = carregarBanco();

    if (!banco.lojas) {
        banco.lojas = [];
        salvarBanco(banco);
    }

    return banco.lojas;
}

function salvarRecebimentos(recebimentos) {
    const banco = carregarBanco();

    banco.recebimentos = recebimentos;

    salvarBanco(banco);
}

function salvarEnvios(envios) {
    const banco = carregarBanco();

    banco.envios = envios;

    salvarBanco(banco);
}

function salvarLojas(lojas) {
    const banco = carregarBanco();

    banco.lojas = lojas;

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

function obterUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) {
        return {
            nome: "Administrador"
        };
    }

    const usuario = JSON.parse(usuarioSalvo);

    return {
        nome: usuario.nome || usuario.nomeCompleto || usuario.email || "Administrador"
    };
}

function obterCodigoLojaDoEnvio(envio) {
    return envio.codigoLoja || envio.lojaCodigo || envio.codigo || "";
}

function buscarLojaPorCodigo(codigoLoja) {
    const lojas = buscarLojasSalvas();

    return lojas.find(function(loja) {
        return loja.codigo === codigoLoja;
    });
}

function formatarDataHora(dataHora) {
    if (!dataHora) {
        return "-";
    }

    const data = new Date(dataHora);

    if (isNaN(data.getTime())) {
        return dataHora;
    }

    return data.toLocaleString("pt-BR");
}

function carregarCardsRecebimentos() {
    const recebimentos = buscarRecebimentosSalvos();
    const envios = buscarEnviosSalvos();

    const totalRecebimentos = recebimentos.length;

    const totalTaloesRecebidos = recebimentos.reduce(function(total, recebimento) {
        return total + Number(recebimento.quantidadeRecebida);
    }, 0);

    const enviosPendentes = envios.filter(function(envio) {
        return envio.status === "Pendente";
    }).length;

    const lojasAtualizadas = new Set(recebimentos.map(function(recebimento) {
        return recebimento.codigoLoja;
    })).size;

    document.getElementById("totalRecebimentos").textContent = totalRecebimentos;
    document.getElementById("totalTaloesRecebidos").textContent = totalTaloesRecebidos;
    document.getElementById("enviosPendentesRecebimento").textContent = enviosPendentes;
    document.getElementById("lojasAtualizadasRecebimento").textContent = lojasAtualizadas;

    atualizarSininhoRecebimentos();
}

function carregarTabelaRecebimentos() {
    const tabela = document.getElementById("tabelaRecebimentos");
    tabela.innerHTML = "";

    const recebimentos = buscarRecebimentosSalvos();

    recebimentos.forEach(function(recebimento) {
        const loja = buscarLojaPorCodigo(recebimento.codigoLoja);

        tabela.innerHTML += `
            <tr>
                <td>${formatarDataHora(recebimento.dataHora)}</td>
                <td>${loja ? loja.nome : "Loja desconhecida"}</td>
                <td>${recebimento.quantidadeRecebida}</td>
                <td>${recebimento.responsavel}</td>
                <td>
                    <span class="badge-status badge-normal">
                        Confirmado
                    </span>
                </td>
                <td>${recebimento.observacao || "-"}</td>
            </tr>
        `;
    });

    aplicarResponsividadeTabelas();
}

function carregarEnviosPendentesNoFormulario() {
    const selectEnvio = document.getElementById("envioRecebimento");
    const envios = buscarEnviosSalvos();

    selectEnvio.innerHTML = "";

    let encontrouPendente = false;

    envios.forEach(function(envio, index) {
        if (envio.status === "Pendente") {
            encontrouPendente = true;

            const codigoLoja = obterCodigoLojaDoEnvio(envio);
            const loja = buscarLojaPorCodigo(codigoLoja);
            const nomeLoja = loja ? loja.nome : "Loja desconhecida";

            selectEnvio.innerHTML += `
                <option value="${index}">
                    ${nomeLoja} - ${envio.quantidade} talões - ${envio.remessa || "Sem remessa"}
                </option>
            `;
        }
    });

    if (!encontrouPendente) {
        selectEnvio.innerHTML = `
            <option value="">
                Nenhum envio pendente
            </option>
        `;
    }
}

function abrirFormularioRecebimento() {
    document.getElementById("formRecebimento").reset();

    carregarEnviosPendentesNoFormulario();

    document.getElementById("formRecebimentoContainer").classList.remove("hidden");
    document.getElementById("formRecebimentoOverlay").classList.remove("hidden");
}

function fecharFormularioRecebimento() {
    document.getElementById("formRecebimentoContainer").classList.add("hidden");
    document.getElementById("formRecebimentoOverlay").classList.add("hidden");
}

document.getElementById("formRecebimento").addEventListener("submit", function(event) {
    event.preventDefault();

    const indiceEnvio = document.getElementById("envioRecebimento").value;
    const quantidadeRecebida = Number(document.getElementById("quantidadeRecebida").value);
    const observacao = document.getElementById("observacaoRecebimento").value;
    const usuario = obterUsuarioLogado();

    if (indiceEnvio === "") {
        mostrarAlerta("Selecione um envio pendente.");
        return;
    }

    if (quantidadeRecebida <= 0) {
        mostrarAlerta("Informe uma quantidade válida.");
        return;
    }

    const envios = buscarEnviosSalvos();
    const envioSelecionado = envios[Number(indiceEnvio)];

    if (!envioSelecionado) {
        mostrarAlerta("Envio não encontrado.");
        return;
    }

    if (envioSelecionado.status !== "Pendente") {
        mostrarAlerta("Este envio já foi recebido.");
        return;
    }

    if (quantidadeRecebida > Number(envioSelecionado.quantidade)) {
        mostrarAlerta("A quantidade recebida não pode ser maior que a enviada.");
        return;
    }

    const codigoLoja = obterCodigoLojaDoEnvio(envioSelecionado);

    if (!codigoLoja) {
        mostrarAlerta("Não foi possível identificar a loja do envio.");
        return;
    }

    const recebimentos = buscarRecebimentosSalvos();

    const novoRecebimento = {
        id: Date.now(),
        dataHora: new Date().toISOString(),
        envioId: envioSelecionado.id || null,
        codigoLoja: codigoLoja,
        quantidadeRecebida: quantidadeRecebida,
        responsavel: usuario.nome,
        observacao: observacao
    };

    recebimentos.push(novoRecebimento);

    envioSelecionado.status = "Recebido";

    const lojas = buscarLojasSalvas();

    const lojasAtualizadas = lojas.map(function(loja) {
        if (loja.codigo === codigoLoja) {
            return {
                ...loja,
                estoqueAtual: Number(loja.estoqueAtual) + quantidadeRecebida
            };
        }

        return loja;
    });

    salvarRecebimentos(recebimentos);
    salvarEnvios(envios);
    salvarLojas(lojasAtualizadas);

    carregarCardsRecebimentos();
    carregarTabelaRecebimentos();

    fecharFormularioRecebimento();

    mostrarAlerta("Recebimento registrado e estoque atualizado com sucesso.");
});

function atualizarSininhoRecebimentos() {
    const envios = buscarEnviosSalvos();

    const enviosPendentes = envios.filter(function(envio) {
        return envio.status === "Pendente";
    }).length;

    const contador = document.getElementById("contadorEnviosPendentes");
    const botaoSininho = document.querySelector(".notification-button");

    if (!contador || !botaoSininho) {
        return;
    }

    if (enviosPendentes > 0) {
        contador.textContent = enviosPendentes;
        contador.classList.remove("hidden");
        botaoSininho.classList.add("has-notification");
    } else {
        contador.textContent = "0";
        contador.classList.add("hidden");
        botaoSininho.classList.remove("has-notification");
    }
}


carregarUsuarioLogado();
carregarCardsRecebimentos();
carregarTabelaRecebimentos();
atualizarSininhoRecebimentos();