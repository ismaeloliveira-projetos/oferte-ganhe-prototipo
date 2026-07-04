const { pool } = require("../database/conexao");
const recebimentosRepository = require("../repositories/recebimentos.repository");
const AppError = require("../utils/AppError");

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

function mapearRecebimentoLista(recebimento) {
  return {
    ...recebimento,
    quantidadeEnviada: Number(recebimento.quantidadeEnviada),
    quantidadeRecebida: Number(recebimento.quantidadeRecebida),
  };
}

async function listarRecebimentos() {
  const recebimentos = await recebimentosRepository.listarRecebimentos();

  return recebimentos.map(mapearRecebimentoLista);
}

async function confirmarRecebimento(dados) {
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

    if (envio.status !== "PENDENTE") {
      throw new AppError(
        "Esse envio não está pendente e não pode ser recebido.",
        409,
      );
    }

    const quantidadeRecebida = Number(
      dados.quantidadeRecebida ?? envio.quantidade_enviada,
    );

    if (Number.isNaN(quantidadeRecebida) || quantidadeRecebida <= 0) {
      throw new AppError("A quantidade recebida deve ser maior que zero.", 400);
    }

    if (quantidadeRecebida !== Number(envio.quantidade_enviada)) {
      throw new AppError(
        "Por enquanto, o recebimento precisa ser total, igual à quantidade enviada.",
        400,
      );
    }

    const estoque = await recebimentosRepository.buscarEstoqueLojaParaAtualizar(
      client,
      envio.loja_id,
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
        lojaId: envio.loja_id,
        usuarioRecebimentoId,
        quantidadeRecebida,
        observacao,
      },
    );

    await recebimentosRepository.atualizarEstoqueLoja(
      client,
      envio.loja_id,
      saldoPosterior,
    );

    await recebimentosRepository.criarMovimentacaoRecebimento(client, {
      lojaId: envio.loja_id,
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
