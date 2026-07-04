const enviosRepository = require("../repositories/envios.repository");
const AppError = require("../utils/AppError");

function mapearEnvioResposta(envio) {
  return {
    id: envio.id,
    codigoRemessa: envio.codigo_remessa,
    lojaId: envio.loja_id,
    usuarioEnvioId: envio.usuario_envio_id,
    quantidadeEnviada: Number(envio.quantidade_enviada),
    dataEnvio: envio.data_envio,
    status: envio.status,
    criadoEm: envio.criado_em,
  };
}

async function listarEnvios() {
  const envios = await enviosRepository.listarEnvios();

  return envios.map(function (envio) {
    return {
      ...envio,
      quantidadeEnviada: Number(envio.quantidadeEnviada),
    };
  });
}

async function cadastrarEnvio(dados) {
  const codigoRemessa = String(dados.codigoRemessa || "").trim();
  const lojaId = Number(dados.lojaId);

  const usuarioEnvioId = dados.usuarioEnvioId
    ? Number(dados.usuarioEnvioId)
    : null;

  const quantidadeEnviada = Number(dados.quantidadeEnviada);

  if (!codigoRemessa || !dados.lojaId || !dados.quantidadeEnviada) {
    throw new AppError(
      "Código da remessa, loja e quantidade enviada são obrigatórios.",
      400,
    );
  }

  if (Number.isNaN(lojaId) || Number.isNaN(quantidadeEnviada)) {
    throw new AppError("Loja e quantidade enviada devem ser números.", 400);
  }

  if (usuarioEnvioId !== null && Number.isNaN(usuarioEnvioId)) {
    throw new AppError("Usuário de envio deve ser um número.", 400);
  }

  if (quantidadeEnviada <= 0) {
    throw new AppError("A quantidade enviada deve ser maior que zero.", 400);
  }

  const lojaExiste = await enviosRepository.buscarLojaAtivaPorId(lojaId);

  if (!lojaExiste) {
    throw new AppError("Loja não encontrada ou inativa.", 404);
  }

  const remessaExiste =
    await enviosRepository.buscarEnvioPorCodigoRemessa(codigoRemessa);

  if (remessaExiste) {
    throw new AppError(
      "Já existe um envio cadastrado com esse código de remessa.",
      409,
    );
  }

  const envioCriado = await enviosRepository.criarEnvio({
    codigoRemessa,
    lojaId,
    usuarioEnvioId,
    quantidadeEnviada,
  });

  return mapearEnvioResposta(envioCriado);
}

module.exports = {
  listarEnvios,
  cadastrarEnvio,
};
