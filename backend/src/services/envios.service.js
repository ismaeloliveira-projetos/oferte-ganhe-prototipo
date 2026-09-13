const { enviarEmailNotificacaoEnvio } = require("./email.service");
const enviosRepository = require("../repositories/envios.repository");
const { pool } = require("../database/conexao");
const AppError = require("../utils/appError");

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

async function notificarDestinatariosDoEnvio({
  envio,
  lojaOrigem,
  lojaDestino,
}) {
  try {
    const destinatarios =
      await enviosRepository.listarDestinatariosAtivosPorLojaId(envio.loja_id);

    if (destinatarios.length === 0) {
      return {
        status: "SEM_DESTINATARIOS",
        destinatariosEncontrados: 0,
        emailsEnviados: 0,
        emailsComFalha: 0,
      };
    }

    const resultados = await Promise.allSettled(
      destinatarios.map(function (destinatario) {
        return enviarEmailNotificacaoEnvio({
          para: destinatario.email,
          nome: destinatario.nome,
          codigoRemessa: envio.codigo_remessa,
          quantidadeEnviada: Number(envio.quantidade_enviada),
          lojaOrigem: `${lojaOrigem.codigoLoja} - ${lojaOrigem.nomeLoja}`,
          lojaDestino: `${lojaDestino.codigoLoja} - ${lojaDestino.nomeLoja}`,
        });
      }),
    );

    const emailsEnviados = resultados.filter(function (resultado) {
      return resultado.status === "fulfilled";
    }).length;

    const emailsComFalha = resultados.length - emailsEnviados;

    if (emailsComFalha > 0) {
      console.error(
        `Falha ao enviar ${emailsComFalha} notificação(ões) de envio.`,
      );
    }

    return {
      status:
        emailsEnviados === resultados.length
          ? "ENVIADA"
          : emailsEnviados === 0
            ? "NAO_ENVIADA"
            : "PARCIALMENTE_ENVIADA",
      destinatariosEncontrados: destinatarios.length,
      emailsEnviados,
      emailsComFalha,
    };
  } catch (erro) {
    console.error("Erro ao notificar envio por e-mail:", erro);

    return {
      status: "NAO_ENVIADA",
      destinatariosEncontrados: 0,
      emailsEnviados: 0,
      emailsComFalha: 0,
    };
  }
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

  const lojaOrigem = await enviosRepository.buscarLojaAtivaPorId(lojaSedeId);

  if (!lojaOrigem) {
    throw new AppError("Loja Sede não encontrada ou inativa.", 500);
  }

  const lojaDestino = await enviosRepository.buscarLojaAtivaPorId(lojaId);

  if (!lojaDestino) {
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
  let envioCriado;

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

    const reservaUsoInterno = Number(estoqueSede.quantidadeMinima);

    if (!Number.isFinite(reservaUsoInterno) || reservaUsoInterno < 0) {
      throw new AppError("Reserva de uso interno da Loja Sede inválida.", 500);
    }

    const disponivelParaEnvio = Math.max(0, saldoAnterior - reservaUsoInterno);

    if (quantidadeEnviada > disponivelParaEnvio) {
      throw new AppError(
        "Estoque insuficiente para envio. " +
          `Disponível para abastecer lojas: ${disponivelParaEnvio}. ` +
          `Reserva para uso interno da Matriz: ${reservaUsoInterno}.`,
        409,
      );
    }

    const saldoPosterior = saldoAnterior - quantidadeEnviada;

    envioCriado = await enviosRepository.criarEnvio(client, {
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
  } catch (erro) {
    if (transacaoAberta) {
      await client.query("ROLLBACK");
    }

    throw erro;
  } finally {
    client.release();
  }

  const notificacaoEmail = await notificarDestinatariosDoEnvio({
    envio: envioCriado,
    lojaOrigem,
    lojaDestino,
  });

  return {
    ...mapearEnvioResposta(envioCriado),
    notificacaoEmail,
  };
}

module.exports = {
  listarEnvios,
  cadastrarEnvio,
};
