function buscarTodasManutencoes() {
    const banco = carregarBanco();
    if (!banco.manutencoes) { banco.manutencoes = []; salvarBanco(banco); }
    return banco.manutencoes;
}

function buscarManutencoesSalvas() {
    return filtrarPorLoja(buscarTodasManutencoes(), buscarUsuarioLogado(), "codigoLoja");
}

function buscarTodasLojas() {
    const banco = carregarBanco();
    if (!banco.lojas) { banco.lojas = []; salvarBanco(banco); }
    return banco.lojas;
}

function buscarLojasSalvas() {
    return filtrarPorLoja(buscarTodasLojas(), buscarUsuarioLogado(), "codigo");
}

function salvarManutencoes(manutencoes) {
    const banco = carregarBanco();
    banco.manutencoes = manutencoes;
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
    setTimeout(() => alerta.classList.add("hidden"), 3000);
}

function obterUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");
    if (!usuarioSalvo) return { nome: "Administrador" };
    const usuario = JSON.parse(usuarioSalvo);
    return { nome: usuario.nome || usuario.nomeCompleto || usuario.email || "Administrador" };
}

function formatarDataHora(dataHora) {
    if (!dataHora) return "-";
    const data = new Date(dataHora);
    if (isNaN(data.getTime())) return dataHora;
    return data.toLocaleString("pt-BR");
}

function buscarLojaPorCodigo(codigoLoja) {
    const lojas = buscarLojasSalvas();
    return lojas.find((loja) => loja.codigo === codigoLoja);
}

function obterEstoqueAtualDaLoja(loja) {
    return Number(loja.estoqueAtual ?? loja.quantidadeAtual ?? loja.recomendado ?? loja.estoqueRecomendado ?? 0);
}

function carregarLojasNoFormulario() {
    const selectLoja = document.getElementById("lojaManutencao");
    const lojas = buscarLojasSalvas();
    selectLoja.innerHTML = "";

    if (lojas.length === 0) {
        selectLoja.innerHTML = `<option value="">Nenhuma loja cadastrada</option>`;
        return;
    }

    lojas.forEach((loja) => {
        selectLoja.innerHTML += `<option value="${loja.codigo}">${loja.codigo} - ${loja.nome}</option>`;
    });
}

function preencherResponsavelManutencao() {
    const usuario = obterUsuarioLogado();
    const inputResponsavel = document.getElementById("responsavelManutencao");
    if (inputResponsavel) inputResponsavel.value = usuario.nome;
}

function obterClasseTipoManutencao(tipo) {
    if (tipo === "entrada") return "badge-normal";
    if (tipo === "saida" || tipo === "perda" || tipo === "avaria") return "badge-critico";
    return "badge-atencao";
}

function carregarCardsManutencao() {
    const manutencoes = buscarManutencoesSalvas();
    const totalManutencoes = manutencoes.length;
    const entradas = manutencoes.filter((m) => m.tipo === "entrada").length;
    const saidas = manutencoes.filter((m) => m.tipo === "saida" || m.tipo === "perda" || m.tipo === "avaria").length;
    const lojasAjustadas = new Set(manutencoes.map((m) => m.codigoLoja)).size;

    document.getElementById("totalManutencoes").textContent = totalManutencoes;
    document.getElementById("entradasManuais").textContent = entradas;
    document.getElementById("saidasManuais").textContent = saidas;
    document.getElementById("lojasAjustadas").textContent = lojasAjustadas;
}

function carregarTabelaManutencoes() {
    const tabela = document.getElementById("tabelaManutencoes");
    tabela.innerHTML = "";
    const manutencoes = buscarManutencoesSalvas();

    manutencoes.forEach(function(manutencao) {
        const loja = buscarLojaPorCodigo(manutencao.codigoLoja);
        const classeTipo = obterClasseTipoManutencao(manutencao.tipo);

        tabela.innerHTML += `
            <tr>
                <td>${formatarDataHora(manutencao.dataHora)}</td>
                <td>${loja ? loja.nome : "Loja desconhecida"}</td>
                <td><span class="badge-status ${classeTipo}">${manutencao.tipo}</span></td>
                <td>${manutencao.quantidade}</td>
                <td>${manutencao.responsavel}</td>
                <td>${manutencao.motivo}</td>
            </tr>
        `;
    });

    aplicarResponsividadeTabelas();
}

function abrirFormularioManutencao() {
    document.getElementById("formManutencao").reset();
    carregarLojasNoFormulario();
    preencherResponsavelManutencao();
    document.getElementById("formManutencaoContainer").classList.remove("hidden");
    document.getElementById("formManutencaoOverlay").classList.remove("hidden");
}

function fecharFormularioManutencao() {
    document.getElementById("formManutencaoContainer").classList.add("hidden");
    document.getElementById("formManutencaoOverlay").classList.add("hidden");
}

function calcularNovoEstoque(estoqueAtual, tipo, quantidade) {
    const tipoNormalizado = tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (tipoNormalizado === "entrada") return estoqueAtual + quantidade;
    if (tipoNormalizado === "saida" || tipoNormalizado === "perda" || tipoNormalizado === "avaria") return estoqueAtual - quantidade;
    if (tipoNormalizado === "correcao") return quantidade;
    return estoqueAtual;
}

document.addEventListener("DOMContentLoaded", function() {
    carregarUsuarioLogado();
    carregarCardsManutencao();
    carregarTabelaManutencoes();

    const formManutencao = document.getElementById("formManutencao");
    if (!formManutencao) { console.error("Formulário de manutenção não encontrado."); return; }

    formManutencao.addEventListener("submit", function(event) {
        event.preventDefault();

        const codigoLoja = document.getElementById("lojaManutencao").value;
        const tipo = document.getElementById("tipoManutencao").value;
        const quantidade = Number(document.getElementById("quantidadeManutencao").value);
        const motivo = document.getElementById("motivoManutencao").value;
        const responsavel = document.getElementById("responsavelManutencao").value || obterUsuarioLogado().nome;
        const observacao = document.getElementById("observacaoManutencao").value;

        if (!codigoLoja) { mostrarAlerta("Selecione uma loja."); return; }
        if (!tipo) { mostrarAlerta("Selecione o tipo de manutenção."); return; }
        if (quantidade <= 0) { mostrarAlerta("Informe uma quantidade válida."); return; }
        if (!motivo) { mostrarAlerta("Informe o motivo da manutenção."); return; }

        const lojas = buscarTodasLojas();
        const lojaSelecionada = lojas.find((loja) => String(loja.codigo) === String(codigoLoja));
        if (!lojaSelecionada) { mostrarAlerta("Loja não encontrada."); return; }

        const estoqueAnterior = obterEstoqueAtualDaLoja(lojaSelecionada);
        const estoqueAtualizado = calcularNovoEstoque(estoqueAnterior, tipo, quantidade);

        if (estoqueAtualizado < 0) { mostrarAlerta("A manutenção deixaria o estoque negativo."); return; }

        const manutencoes = buscarTodasManutencoes();

        const novaManutencao = {
            id: Date.now(),
            dataHora: new Date().toISOString(),
            codigoLoja: codigoLoja,
            tipo: tipo,
            quantidade: quantidade,
            motivo: motivo,
            responsavel: responsavel,
            estoqueAnterior: estoqueAnterior,
            estoqueAtualizado: estoqueAtualizado,
            observacao: observacao
        };

        manutencoes.push(novaManutencao);

        const lojasAtualizadas = lojas.map(function(loja) {
            if (String(loja.codigo) === String(codigoLoja)) {
                return { ...loja, estoqueAtual: estoqueAtualizado, quantidadeAtual: estoqueAtualizado };
            }
            return loja;
        });

        salvarManutencoes(manutencoes);
        salvarLojas(lojasAtualizadas);

        carregarCardsManutencao();
        carregarTabelaManutencoes();
        fecharFormularioManutencao();
        mostrarAlerta("Manutenção registrada e estoque atualizado com sucesso.");
    });
});