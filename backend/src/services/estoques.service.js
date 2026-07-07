const estoquesRepository = require("../repositories/estoques.repository");
const AppError = require("../utils/AppError");

function calcularStatusEstoque(estoque) {
  const estoqueAtual = Number(estoque.estoqueAtual);
  const estoqueMinimo = Number(estoque.estoqueMinimo);
  const estoqueRecomendado = Number(estoque.estoqueRecomendado);

  if (estoqueAtual <= estoqueMinimo) {
    return "Crítico";
  }

  if (estoqueAtual < estoqueRecomendado) {
    return "Atenção";
  }

  return "Normal";
}

async function listarEstoques(contextoUsuario) {
  const estoques = await estoquesRepository.listarEstoques(contextoUsuario);

  return estoques;
}

async function listarEstoques(contextoUsuario) {
  const estoques = await estoquesRepository.listarEstoques(contextoUsuario);

  return estoques;
}

async function listarMovimentacoes(filtros = {}) {
  let lojaId = null;

  if (filtros.lojaId) {
    lojaId = Number(filtros.lojaId);

    if (Number.isNaN(lojaId)) {
      throw new AppError("lojaId deve ser um número.", 400);
    }
  }

  const movimentacoes =
    await estoquesRepository.listarMovimentacoesEstoque(lojaId);

  return movimentacoes.map(function (movimentacao) {
    return {
      ...movimentacao,
      quantidade: Number(movimentacao.quantidade),
      saldoAnterior: Number(movimentacao.saldoAnterior),
      saldoPosterior: Number(movimentacao.saldoPosterior),
    };
  });
}

module.exports = {
  listarEstoques,
  listarMovimentacoes,
};
