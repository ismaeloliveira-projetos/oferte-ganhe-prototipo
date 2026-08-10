const { pool } = require("../database/conexao");
const consumosRepository = require("../repositories/consumos.repository");
const AppError = require("../utils/AppError");

function validarAcessoLoja(contextoUsuario, lojaId) {
  if (!contextoUsuario) {
    throw new AppError("Contexto do usuário não encontrado.", 401);
  }

  if (contextoUsuario.acessoGlobal) {
    return;
  }

  if (!contextoUsuario.lojasIds.includes(lojaId)) {
    throw new AppError("Você não tem permissão para acessar esta loja.", 403);
  }
}

function obterUsuarioIdContexto(contextoUsuario) {
  const usuarioId = Number(contextoUsuario?.id);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    throw new AppError("Usuário autenticado inválido.", 401);
  }

  return usuarioId;
}

function obterDataAtualLocal() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function normalizarDataConsumo(dataConsumo) {
  if (!dataConsumo) {
    return obterDataAtualLocal();
  }

  const dataNormalizada = String(dataConsumo).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNormalizada)) {
    throw new AppError("dataConsumo deve estar no formato YYYY-MM-DD.", 400);
  }

  const [ano, mes, dia] = dataNormalizada.split("-").map(Number);

  const data = new Date(ano, mes - 1, dia);

  const dataValida =
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia;

  if (!dataValida) {
    throw new AppError("dataConsumo é inválida.", 400);
  }

  if (dataNormalizada > obterDataAtualLocal()) {
    throw new AppError("dataConsumo não pode estar no futuro.", 400);
  }

  return dataNormalizada;
}

async function listarConsumos(contextoUsuario) {
  const consumos = await consumosRepository.listarConsumos(contextoUsuario);

  return consumos.map(function (consumo) {
    return {
      ...consumo,
      quantidade: Number(consumo.quantidade),
    };
  });
}

async function registrarConsumo(dados, contextoUsuario) {
  const lojaId = Number(dados.lojaId);
  const quantidade = Number(dados.quantidade);
  const observacao = String(dados.observacao || "").trim() || null;

  if (!dados.lojaId || !Number.isInteger(lojaId) || lojaId <= 0) {
    throw new AppError("lojaId é obrigatório e deve ser um número.", 400);
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new AppError(
      "quantidade deve ser um número inteiro maior que zero.",
      400,
    );
  }

  validarAcessoLoja(contextoUsuario, lojaId);

  const usuarioId = obterUsuarioIdContexto(contextoUsuario);
  const dataConsumo = normalizarDataConsumo(dados.dataConsumo);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const loja = await consumosRepository.buscarLojaAtivaParaAtualizar(
      client,
      lojaId,
    );

    if (!loja) {
      throw new AppError("Loja não encontrada ou inativa.", 404);
    }

    const estoque = await consumosRepository.buscarEstoqueLojaParaAtualizar(
      client,
      lojaId,
    );

    if (!estoque) {
      throw new AppError("Estoque da loja não encontrado.", 404);
    }

    const saldoAnterior = Number(estoque.estoque_atual);
    const saldoPosterior = saldoAnterior - quantidade;

    if (saldoPosterior < 0) {
      throw new AppError("O consumo não pode deixar o estoque negativo.", 400);
    }

    const consumoCriado = await consumosRepository.criarConsumo(client, {
      lojaId,
      usuarioId,
      quantidade,
      observacao,
      dataConsumo,
    });

    await consumosRepository.atualizarEstoqueLoja(
      client,
      lojaId,
      saldoPosterior,
    );

    await consumosRepository.criarMovimentacaoConsumo(client, {
      lojaId,
      usuarioId,
      consumoId: consumoCriado.id,
      quantidade,
      saldoAnterior,
      saldoPosterior,
      observacao,
    });

    await client.query("COMMIT");

    return {
      id: consumoCriado.id,
      lojaId: consumoCriado.loja_id,
      usuarioId: consumoCriado.usuario_id,
      quantidade: Number(consumoCriado.quantidade),
      observacao: consumoCriado.observacao,
      dataConsumo: consumoCriado.data_consumo,
      saldoAnterior,
      saldoPosterior,
      criadoEm: consumoCriado.criado_em,
      mensagem: "Consumo registrado e estoque atualizado com sucesso.",
    };
  } catch (erro) {
    await client.query("ROLLBACK");
    throw erro;
  } finally {
    client.release();
  }
}

module.exports = {
  listarConsumos,
  registrarConsumo,
};
