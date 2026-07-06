const { pool } = require("../database/conexao");
const lojasRepository = require("../repositories/lojas.repository");
const AppError = require("../utils/AppError");

function normalizarCodigoLoja(codigo) {
  return String(codigo || "")
    .trim()
    .padStart(3, "0");
}

function validarNumero(valor, nomeCampo) {
  if (Number.isNaN(valor)) {
    throw new AppError(`${nomeCampo} deve ser um número.`, 400);
  }
}

function mapearLojaResposta(loja, estoqueAtual = 0) {
  return {
    id: loja.id,
    codigo: loja.codigo_loja,
    nome: loja.nome_loja,
    estoqueAtual: Number(estoqueAtual),
    estoqueMinimo: Number(loja.quantidade_minima),
    estoqueRecomendado: Number(loja.quantidade_recomendada),
    ativo: loja.ativo,
    criadoEm: loja.criado_em,
  };
}

async function listarLojas(contextoUsuario) {
  const lojas = await lojasRepository.listarLojasAtivas(contextoUsuario);

  return lojas.map(mapearLojaResposta);
}

async function cadastrarLoja(dados) {
  const codigoBruto = String(dados.codigo || "").trim();
  const nome = String(dados.nome || "").trim();

  if (!codigoBruto || !nome) {
    throw new AppError("Código e nome da loja são obrigatórios.", 400);
  }

  const codigo = normalizarCodigoLoja(codigoBruto);
  const estoqueAtual = Number(dados.estoqueAtual ?? 0);
  const estoqueMinimo = Number(dados.estoqueMinimo ?? 200);
  const estoqueRecomendado = Number(dados.estoqueRecomendado ?? 300);

  validarNumero(estoqueAtual, "Estoque atual");
  validarNumero(estoqueMinimo, "Estoque mínimo");
  validarNumero(estoqueRecomendado, "Estoque recomendado");

  const lojaExistente = await lojasRepository.buscarLojaPorCodigo(codigo);

  if (lojaExistente) {
    throw new AppError("Já existe uma loja cadastrada com esse código.", 409);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const lojaCriada = await lojasRepository.criarLoja(client, {
      codigo,
      nome,
      estoqueMinimo,
      estoqueRecomendado,
    });

    await lojasRepository.criarEstoqueInicial(
      client,
      lojaCriada.id,
      estoqueAtual,
    );

    await client.query("COMMIT");

    return mapearLojaResposta(lojaCriada, estoqueAtual);
  } catch (erro) {
    await client.query("ROLLBACK");
    throw erro;
  } finally {
    client.release();
  }
}

async function atualizarLoja(codigoOriginalParametro, dados) {
  const codigoOriginal = normalizarCodigoLoja(codigoOriginalParametro);

  const codigoBruto = String(dados.codigo || "").trim();
  const nome = String(dados.nome || "").trim();

  if (!codigoBruto || !nome) {
    throw new AppError("Código e nome da loja são obrigatórios.", 400);
  }

  const codigo = normalizarCodigoLoja(codigoBruto);
  const estoqueMinimo = Number(dados.estoqueMinimo ?? 200);
  const estoqueRecomendado = Number(dados.estoqueRecomendado ?? 300);

  validarNumero(estoqueMinimo, "Estoque mínimo");
  validarNumero(estoqueRecomendado, "Estoque recomendado");

  const lojaComMesmoCodigo = await lojasRepository.buscarLojaComCodigoDiferente(
    codigo,
    codigoOriginal,
  );

  if (lojaComMesmoCodigo) {
    throw new AppError("Já existe outra loja cadastrada com esse código.", 409);
  }

  const lojaAtualizada = await lojasRepository.atualizarLojaPorCodigo(
    codigoOriginal,
    {
      codigo,
      nome,
      estoqueMinimo,
      estoqueRecomendado,
    },
  );

  if (!lojaAtualizada) {
    throw new AppError("Loja não encontrada.", 404);
  }

  const estoque = await lojasRepository.buscarEstoquePorLojaId(
    lojaAtualizada.id,
  );

  const estoqueAtual = estoque?.estoque_atual ?? 0;

  return mapearLojaResposta(lojaAtualizada, estoqueAtual);
}

async function inativarLoja(codigoParametro) {
  const codigo = normalizarCodigoLoja(codigoParametro);

  const lojaInativada = await lojasRepository.inativarLojaPorCodigo(codigo);

  if (!lojaInativada) {
    throw new AppError("Loja não encontrada.", 404);
  }

  return {
    id: lojaInativada.id,
    codigo: lojaInativada.codigo_loja,
    nome: lojaInativada.nome_loja,
    estoqueMinimo: Number(lojaInativada.quantidade_minima),
    estoqueRecomendado: Number(lojaInativada.quantidade_recomendada),
    ativo: lojaInativada.ativo,
    criadoEm: lojaInativada.criado_em,
    mensagem: "Loja inativada com sucesso.",
  };
}

module.exports = {
  listarLojas,
  cadastrarLoja,
  atualizarLoja,
  inativarLoja,
};
