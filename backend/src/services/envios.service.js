const enviosRepository = require("../repositories/envios.repository");
const { pool } = require("../database/conexao");
const AppError = require("../utils/AppError");

function mapearEnvioResposta(envio) {
  return {
    id: envio.id,
    codigoRemessa: envio.codigo_remessa ?? envio.codigoRemessa,

    lojaOrigemId: envio.loja_origem_id ?? envio.lojaOrigemId,

    lojaId: envio.loja_id ?? envio.lojaId,

    usuarioEnvioId: envio.usuario_envio_id ?? envio.usuarioEnvioId,

    quantidadeEnviada: Number(
      envio.quantidade_enviada ?? envio.quantidadeEnviada,
    ),

    dataEnvio: envio.data_envio ?? envio.dataEnvio,

    status: envio.status,
    criadoEm: envio.criado_em ?? envio.criadoEm,
  };
}

async function listarEnvios(contextoUsuario) {
  const envios = await enviosRepository.listarEnvios(contextoUsuario);

  return envios.map(function (envio) {
    return {
      ...envio,
      quantidadeEnviada: Number(envio.quantidadeEnviada),
    };
  });
}

async function cadastrarEnvio(dados, contextoUsuario) {
  const codigoRemessa = String(dados.codigoRemessa || "").trim();
  const lojaId = Number(dados.lojaId);
  const quantidadeEnviada = Number(dados.quantidadeEnviada);

  const lojaSedeId = Number(process.env.LOJA_SEDE_ID);

  if (!contextoUsuario?.id) {
    throw new AppError("Usuário não autenticado.", 401);
  }

  if (!contextoUsuario.acessoGlobal) {
    throw new AppError(
      "Somente usuários com acesso global podem registrar envios da Loja Sede.",
      403,
    );
  }

  if (!Number.isInteger(lojaSedeId) || lojaSedeId <= 0) {
    throw new AppError(
      "LOJA_SEDE_ID não foi configurado corretamente no ambiente.",
      500,
    );
  }

  if (!codigoRemessa || !dados.lojaId || !dados.quantidadeEnviada) {
    throw new AppError(
      "Código da remessa, loja e quantidade enviada são obrigatórios.",
      400,
    );
  }

  if (!Number.isInteger(lojaId) || !Number.isInteger(quantidadeEnviada)) {
    throw new AppError(
      "Loja e quantidade enviada devem ser números inteiros.",
      400,
    );
  }

  if (lojaId === lojaSedeId) {
    throw new AppError(
      "A Loja Sede não pode ser o destino do próprio envio.",
      400,
    );
  }

  if (quantidadeEnviada <= 0) {
    throw new AppError("A quantidade enviada deve ser maior que zero.", 400);
  }

  const lojaDestinoExiste = await enviosRepository.buscarLojaAtivaPorId(lojaId);

  if (!lojaDestinoExiste) {
    throw new AppError("Loja de destino não encontrada ou inativa.", 404);
  }

  const remessaExiste =
    await enviosRepository.buscarEnvioPorCodigoRemessa(codigoRemessa);

  if (remessaExiste) {
    throw new AppError(
      "Já existe um envio cadastrado com esse código de remessa.",
      409,
    );
  }

  const client = await pool.connect();
  let transacaoAberta = false;

  try {
    await client.query("BEGIN");
    transacaoAberta = true;

    const estoqueSede = await enviosRepository.buscarEstoqueParaAtualizacao(
      client,
      lojaSedeId,
    );

    if (!estoqueSede) {
      throw new AppError(
        "Estoque da Loja Sede não encontrado ou inativo.",
        404,
      );
    }

    const saldoAnterior = Number(estoqueSede.estoqueAtual);

    if (quantidadeEnviada > saldoAnterior) {
      throw new AppError(
        `Estoque insuficiente na Loja Sede. Saldo disponível: ${saldoAnterior}.`,
        409,
      );
    }

    const saldoPosterior = saldoAnterior - quantidadeEnviada;

    const envioCriado = await enviosRepository.criarEnvio(client, {
      codigoRemessa,
      lojaOrigemId: lojaSedeId,
      lojaId,
      usuarioEnvioId: contextoUsuario.id,
      quantidadeEnviada,
    });

    await enviosRepository.atualizarEstoqueLoja(
      client,
      lojaSedeId,
      saldoPosterior,
    );

    await enviosRepository.criarMovimentacaoEnvio(client, {
      lojaId: lojaSedeId,
      usuarioId: contextoUsuario.id,
      envioId: envioCriado.id,
      quantidade: quantidadeEnviada,
      saldoAnterior,
      saldoPosterior,
      observacao:
        `Saída para envio ${envioCriado.codigo_remessa} ` +
        `destinado à loja ${lojaId}.`,
    });

    await client.query("COMMIT");
    transacaoAberta = false;

    return mapearEnvioResposta(envioCriado);
  } catch (erro) {
    if (transacaoAberta) {
      await client.query("ROLLBACK");
    }

    throw erro;
  } finally {
    client.release();
  }
}

module.exports = {
  listarEnvios,
  cadastrarEnvio,
};
