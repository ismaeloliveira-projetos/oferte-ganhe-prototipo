let codigoLojaEditando = null;


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

function obterClassesStatus(status) {
    if (status === "Crítico") {
        return "badge-critico";
    }
    if (status === "Atenção") {
        return "badge-atencao";
    }
    return "badge-normal";
}

function carregarCardsLojas() {

    const lojas = buscarLojasSalvas();

    const totalLojas = lojas.length;
    
    const lojasAtivas = lojas.length; 

    const LojasCriticas = lojas.filter(function(loja) {
        return obterStatusEstoque(loja) === "Crítico";
    }).length;

    const lojasAtencao = lojas.filter(function(loja) {
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


    const lojas = buscarLojasSalvas()

    lojas.forEach(function(loja) {
        const status = obterStatusEstoque(loja);
        const classesStatus = obterClassesStatus(status);  

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
                
                    <button class="btn-table-action btn-sm" onclick="verDetalhesLoja('${loja.codigo}')">
                    Ver detalhes
                    </button>

                    <button class="btn-table-action btn-sm" onclick="editarLoja('${loja.codigo}')">
                    Editar
                    </button>
                    
                    <button class="btn-table-action btn-sm" onclick="excluirLoja('${loja.codigo}')">
                    Excluir
                    </button>
                    
                    
                </td>
            </tr>
        `;
    });

    aplicarResponsividadeTabelas();
}

function abrirMenuMobile() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("menuOverlay").classList.add("open");
}

function fecharMenuMobile() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("open");
}

function fecharDetalhesLoja() {
    document.getElementById("detalhesLojaContainer").classList.add("hidden");
    document.getElementById("detalhesLojaOverlay").classList.add("hidden");
}

function abrirFormularioLoja() {
    document.getElementById("formLoja").reset();

    codigoLojaEditando = null;

    document.getElementById("estoqueMinimo").value = 200;
    document.getElementById("estoqueRecomendado").value = 150;

    document.getElementById("estoqueMinimo").readOnly = true;
    document.getElementById("estoqueRecomendado").readOnly = true;

    document.getElementById("btnSalvarLoja").textContent = "Salvar Loja";

    document.getElementById("formLojaContainer").classList.remove("hidden");
    document.getElementById("formLojaOverlay").classList.remove("hidden");
}

function fecharFormularioLoja() {
    document.getElementById("formLojaContainer").classList.add("hidden");
    document.getElementById("formLojaOverlay").classList.add("hidden");
}


function mostrarAlerta(mensagem) {
    const alerta = document.getElementById("alertaSistema");
    
    alerta.textContent = mensagem;
    alerta.classList.remove("hidden");

    setTimeout(function (){
        alerta.classList.add("hidden");
    }, 3000);
}

function buscarLojasSalvas() {
    const banco = carregarBanco();
    return banco.lojas;
}

function salvarLojas(lojas) {
    const banco = carregarBanco();

    banco.lojas = lojas;

    salvarBanco(banco);
}


document.getElementById("formLoja").addEventListener("submit", function(event) {
    event.preventDefault();

    const botaoSalvar = document.getElementById("btnSalvarLoja");

    botaoSalvar.textContent = "Salvando...";
    botaoSalvar.classList.add("loading");
    botaoSalvar.disabled = true;

    setTimeout(function () {
        const codigo = document.getElementById("codigoLoja").value;
        const nome = document.getElementById("nomeLoja").value;
        const estoqueAtual = Number(document.getElementById("estoqueAtual").value);
        const estoqueMinimo = Number(document.getElementById("estoqueMinimo").value);
        const estoqueRecomendado = Number(document.getElementById("estoqueRecomendado").value);

        const lojas = buscarLojasSalvas();

        if (codigoLojaEditando === null) {
            const novaLoja = {
                codigo: codigo,
                nome: nome,
                estoqueAtual: estoqueAtual,
                estoqueMinimo: estoqueMinimo,
                estoqueRecomendado: estoqueRecomendado,
                status: "Ativa"
            };

            lojas.push(novaLoja);

            salvarLojas(lojas);

            mostrarAlerta("Loja cadastrada com sucesso.");
        } else {
            const lojasAtualizadas = lojas.map(function(loja) {
                if (loja.codigo === codigoLojaEditando) {
                    return {
                        ...loja,
                        codigo: codigo,
                        nome: nome,
                        estoqueAtual: estoqueAtual,
                        estoqueMinimo: estoqueMinimo,
                        estoqueRecomendado: estoqueRecomendado
                    };
                }

                return loja;
            });

            salvarLojas(lojasAtualizadas);

            mostrarAlerta("Loja atualizada com sucesso.");
        }

        carregarCardsLojas();
        carregarTabelaLojas();

        botaoSalvar.textContent = "Salvo!";
        botaoSalvar.classList.remove("loading");
        botaoSalvar.classList.add("success");

        setTimeout(function () {
            document.getElementById("formLoja").reset();
            fecharFormularioLoja();

            codigoLojaEditando = null;

            botaoSalvar.textContent = "Salvar Loja";
            botaoSalvar.classList.remove("success");
            botaoSalvar.disabled = false;
        }, 700);

    }, 800);
});

function verDetalhesLoja(codigo) {
   const lojas = buscarLojasSalvas();

   const loja = lojas.find(function(loja) {
    return loja.codigo === codigo;

   });

   if(!loja) {
    mostrarAlerta("Loja não encontrada.");
    return;
 }
    
    const status = obterStatusEstoque(loja);
    const classeStatus = obterClassesStatus(status);
    const conteudo = document.getElementById("detalhesLojaConteudo");

    const faltaParaMinimo = Math.max(loja.estoqueMinimo - loja.estoqueAtual, 0);
const faltaParaRecomendado = Math.max(loja.estoqueRecomendado - loja.estoqueAtual, 0);

let mensagemStatus = "A loja está com estoque dentro do nível esperado.";

if (status === "Crítico") {
    mensagemStatus = "Esta loja está em situação crítica, pois o estoque atual está igual ou abaixo do estoque mínimo.";
}

if (status === "Atenção") {
    mensagemStatus = "Esta loja precisa de atenção, pois está abaixo do estoque recomendado.";
}
   
conteudo.innerHTML = `
    <div class="detail-row">
        <strong>Código</strong>
        <span>${loja.codigo}</span>
    </div>

    <div class="detail-row">
        <strong>Nome da Loja</strong>
        <span>${loja.nome}</span>
    </div>

    <div class="detail-row">
        <strong>Estoque atual</strong>
        <span>${loja.estoqueAtual} talões</span>
    </div>

    <div class="detail-row">
        <strong>Estoque mínimo</strong>
        <span>${loja.estoqueMinimo} talões</span>
    </div>

    <div class="detail-row">
        <strong>Estoque recomendado</strong>
        <span>${loja.estoqueRecomendado} talões</span>
    </div>

    <div class="detail-row">
        <strong>Status</strong>
        <span class="badge ${classeStatus}">${status}</span>
    </div>

    <div class="detail-row">
        <strong>Falta para o mínimo</strong>
        <span>${faltaParaMinimo} talões</span>
    </div>

    <div class="detail-row">
        <strong>Falta para o recomendado</strong>
        <span>${faltaParaRecomendado} talões</span>
    </div>

    <div class="detail-insight">
        <strong>Análise:</strong> ${mensagemStatus}
    </div>
`;

    
 document.getElementById("detalhesLojaContainer").classList.remove("hidden");
document.getElementById("detalhesLojaOverlay").classList.remove("hidden");

}


function editarLoja(codigo) {
    const lojas = buscarLojasSalvas();

    const lojaEncontrada = lojas.find(function(loja) {
        return loja.codigo === codigo;
    });

    if (!lojaEncontrada) {
        mostrarAlerta("Loja não encontrada.");
        return;
    }

    codigoLojaEditando = codigo;

    document.getElementById("codigoLoja").value = lojaEncontrada.codigo;
    document.getElementById("nomeLoja").value = lojaEncontrada.nome;
    document.getElementById("estoqueAtual").value = lojaEncontrada.estoqueAtual;
    document.getElementById("estoqueMinimo").value = lojaEncontrada.estoqueMinimo;
    document.getElementById("estoqueRecomendado").value = lojaEncontrada.estoqueRecomendado;

    document.getElementById("estoqueMinimo").readOnly = false;
    document.getElementById("estoqueRecomendado").readOnly = false;

    document.getElementById("btnSalvarLoja").textContent = "Atualizar Loja";

    document.getElementById("formLojaContainer").classList.remove("hidden");
    document.getElementById("formLojaOverlay").classList.remove("hidden");
}

function excluirLoja(codigo) {
    const lojas = buscarLojasSalvas();

    const lojaEncontrada = lojas.find(function(loja) {
        return loja.codigo === codigo;
    });

    if (!lojaEncontrada) {
        mostrarAlerta("Loja não encontrada.");
        return;
    }

    const confirmarExclusao = confirm(
        "Deseja realmente excluir a loja " + lojaEncontrada.nome + "?"
    );

    if (!confirmarExclusao) {
        return;
    }

    const lojasAtualizadas = lojas.filter(function(loja) {
        return loja.codigo !== codigo;
    });

    salvarLojas(lojasAtualizadas);

    carregarCardsLojas();
    carregarTabelaLojas();

    mostrarAlerta("Loja excluída com sucesso.");
}







carregarUsuarioLogado();
carregarCardsLojas();
carregarTabelaLojas();

