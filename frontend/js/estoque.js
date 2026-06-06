function carregarUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("usuarioLogado");

  if (!usuarioSalvo) {
    window.location.href = "login.html";
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

function obterClasseStatus(status) {
  if (status === "Crítico") {
    return "badge-critico";
  }

  if (status === "Atenção") {
    return "badge-atencao";
  }

  return "badge-normal";
}

function calcularReposicaoSugerida(loja) {
  if (loja.estoqueAtual >= loja.estoqueRecomendado) {
    return 0;
  }

  return loja.estoqueRecomendado - loja.estoqueAtual;
}

function carregarCardsEstoque() {
  const totalEstoque = lojasMockadas.reduce(function (total, loja) {
    return total + loja.estoqueAtual;
  }, 0);

  const lojasCriticas = lojasMockadas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Crítico";
  }).length;

  const lojasAtencao = lojasMockadas.filter(function (loja) {
    return obterStatusEstoque(loja) === "Atenção";
  }).length;

  const reposicaoSugerida = lojasMockadas.reduce(function (total, loja) {
    return total + calcularReposicaoSugerida(loja);
  }, 0);

  document.getElementById("totalEstoque").textContent = totalEstoque;
  document.getElementById("lojasCriticas").textContent = lojasCriticas;
  document.getElementById("lojasAtencao").textContent = lojasAtencao;
  document.getElementById("reposicaoSugerida").textContent = reposicaoSugerida;
}

function carregarTabelaEstoque() {
  const tabela = document.getElementById("tabelaEstoque");

  tabela.innerHTML = "";

  lojasMockadas.forEach(function (loja) {
    const status = obterStatusEstoque(loja);
    const classeStatus = obterClasseStatus(status);
    const reposicaoSugerida = calcularReposicaoSugerida(loja);

    tabela.innerHTML += `
      <tr>
        <td>${loja.codigo}</td>
        <td>${loja.nome}</td>
        <td>${loja.estoqueAtual}</td>
        <td>${loja.estoqueMinimo}</td>
        <td>${loja.estoqueRecomendado}</td>
        <td>${reposicaoSugerida}</td>
        <td>
          <span class="badge-status ${classeStatus}">
            ${status}
          </span>
        </td>
      </tr>
    `;
  });
}

carregarUsuarioLogado();
carregarCardsEstoque();
carregarTabelaEstoque();