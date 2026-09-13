const { pool } = require("../database/conexao");
const recebimentosRepository = require("../repositories/recebimentos.repository");
const AppError = require("../utils/appError");

function normalizarUsuarioId(usuarioId) {
  if (usuarioId === undefined || usuarioId === null || usuarioId === "") {
    return null;
  }

  const usuarioIdNumerico = Number(usuarioId);

  if (Number.isNaN(usuarioIdNumerico)) {
    throw new AppError("Usuário de recebimento deve ser um número.", 400);
  }

  return usuarioIdNumerico;
}

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

function mapearRecebimentoLista(recebimento) {
  return {
    ...recebimento,
    quantidadeEnviada: Number(recebimento.quantidadeEnviada),
    quantidadeRecebida: Number(recebimento.quantidadeRecebida),
  };
}

async function listarRecebimentos(contextoUsuario) {
  const recebimentos =
    await recebimentosRepository.listarRecebimentos(contextoUsuario);

  return recebimentos.map(function (recebimento) {
    return {
      ...recebimento,
      quantidadeRecebida: Number(recebimento.quantidadeRecebida),
    };
  });
}

async function confirmarRecebimento(dados, contextoUsuario) {
  const envioId = Number(dados.envioId);
  const usuarioRecebimentoId = normalizarUsuarioId(dados.usuarioRecebimentoId);

  const observacao = dados.observacao
    ? String(dados.observacao).trim()
    : "Recebimento confirmado pelo sistema.";

  if (!dados.envioId || Number.isNaN(envioId)) {
    throw new AppError("O envioId é obrigatório e deve ser um número.", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const envio = await recebimentosRepository.buscarEnvioParaRecebimento(
      client,
      envioId,
    );

    if (!envio) {
      throw new AppError("Envio não encontrado.", 404);
    }

    validarAcessoLoja(contextoUsuario, Number(envio.lojaId));

    if (envio.status !== "PENDENTE") {
      throw new AppError(
        "Esse envio não está pendente e não pode ser recebido.",
        409,
      );
    }

    const quantidadeEnviada = Number(envio.quantidadeEnviada);

    const quantidadeRecebida = Number(
      dados.quantidadeRecebida ?? quantidadeEnviada,
    );

    if (Number.isNaN(quantidadeRecebida) || quantidadeRecebida <= 0) {
      throw new AppError("A quantidade recebida deve ser maior que zero.", 400);
    }

    if (quantidadeRecebida !== quantidadeEnviada) {
      throw new AppError(
        "Por enquanto, o recebimento precisa ser total, igual à quantidade enviada.",
        400,
      );
    }

    const estoque = await recebimentosRepository.buscarEstoqueLojaParaAtualizar(
      client,
      envio.lojaId,
    );

    if (!estoque) {
      throw new AppError("Estoque da loja não encontrado.", 404);
    }

    const saldoAnterior = Number(estoque.estoque_atual);
    const saldoPosterior = saldoAnterior + quantidadeRecebida;

    const recebimentoCriado = await recebimentosRepository.criarRecebimento(
      client,
      {
        envioId: envio.id,
        lojaId: envio.lojaId,
        usuarioRecebimentoId,
        quantidadeRecebida,
        observacao,
      },
    );

    await recebimentosRepository.atualizarEstoqueLoja(
      client,
      envio.lojaId,
      saldoPosterior,
    );

    await recebimentosRepository.criarMovimentacaoRecebimento(client, {
      lojaId: envio.lojaId,
      usuarioRecebimentoId,
      recebimentoId: recebimentoCriado.id,
      quantidadeRecebida,
      saldoAnterior,
      saldoPosterior,
      observacao,
    });

    await recebimentosRepository.marcarEnvioComoRecebido(client, envio.id);

    await client.query("COMMIT");

    return {
      id: recebimentoCriado.id,
      envioId: recebimentoCriado.envio_id,
      lojaId: recebimentoCriado.loja_id,
      quantidadeRecebida: Number(recebimentoCriado.quantidade_recebida),
      dataRecebimento: recebimentoCriado.data_recebimento,
      saldoAnterior,
      saldoPosterior,
      statusEnvio: "RECEBIDO",
      mensagem: "Recebimento confirmado com sucesso.",
    };
  } catch (erro) {
    await client.query("ROLLBACK");
    throw erro;
  } finally {
    client.release();
  }
}

module.exports = {
  listarRecebimentos,
  confirmarRecebimento,
};
