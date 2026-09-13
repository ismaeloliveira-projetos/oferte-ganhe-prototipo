const estoquesRepository = require("../repositories/estoques.repository");
const AppError = require("../utils/appError");

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

async function listarMovimentacoes(filtros = {}, contextoUsuario) {
  let lojaId = null;

  if (filtros.lojaId) {
    lojaId = Number(filtros.lojaId);

    if (Number.isNaN(lojaId) || lojaId <= 0) {
      throw new AppError("lojaId deve ser um número válido.", 400);
    }
  }

  if (
    contextoUsuario &&
    !contextoUsuario.acessoGlobal &&
    lojaId &&
    !contextoUsuario.lojasIds.includes(lojaId)
  ) {
    throw new AppError("Você não tem permissão para acessar esta loja.", 403);
  }

  const movimentacoes = await estoquesRepository.listarMovimentacoesEstoque(
    lojaId,
    contextoUsuario,
  );

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
