const { pool } = require("../database/conexao");
const manutencoesRepository = require("../repositories/manutencoes.repository");
const AppError = require("../utils/AppError");

const TIPOS_ENTRADA = ["AJUSTE_ENTRADA"];
const TIPOS_SAIDA = ["AJUSTE_SAIDA", "AVARIA", "EXTRAVIO"];

function normalizarUsuarioId(usuarioId) {
  if (usuarioId === undefined || usuarioId === null || usuarioId === "") {
    return null;
  }

  const usuarioIdNumerico = Number(usuarioId);

  if (Number.isNaN(usuarioIdNumerico)) {
    throw new AppError("Usuário deve ser um número.", 400);
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

function obterTipoMovimentacao(tipoManutencao) {
  if (tipoManutencao === "AJUSTE_ENTRADA") {
    return "MANUTENCAO_ENTRADA";
  }

  if (tipoManutencao === "AJUSTE_SAIDA") {
    return "MANUTENCAO_SAIDA";
  }

  return tipoManutencao;
}

function calcularSaldoPosterior(saldoAnterior, tipoManutencao, quantidade) {
  const tipoEhEntrada = TIPOS_ENTRADA.includes(tipoManutencao);

  if (tipoEhEntrada) {
    return saldoAnterior + quantidade;
  }

  return saldoAnterior - quantidade;
}

function validarTipoManutencao(tipoManutencao) {
  const tipoEhEntrada = TIPOS_ENTRADA.includes(tipoManutencao);
  const tipoEhSaida = TIPOS_SAIDA.includes(tipoManutencao);

  if (!tipoEhEntrada && !tipoEhSaida) {
    throw new AppError(
      "Tipo de manutenção inválido ou ainda não suportado.",
      400,
    );
  }
}

function mapearManutencaoLista(manutencao) {
  return {
    ...manutencao,
    quantidade: Number(manutencao.quantidade),
  };
}

async function listarManutencoes(contextoUsuario) {
  const manutencoes =
    await manutencoesRepository.listarManutencoes(contextoUsuario);

  return manutencoes.map(function (manutencao) {
    return {
      ...manutencao,
      quantidade: Number(manutencao.quantidade),
    };
  });
}

async function registrarManutencao(dados, contextoUsuario) {
  const lojaId = Number(dados.lojaId);
  const usuarioId = normalizarUsuarioId(dados.usuarioId);
  const tipoManutencao = String(dados.tipoManutencao || "").trim();
  const quantidade = Number(dados.quantidade);
  const observacao = String(dados.observacao || "").trim();

  if (!dados.lojaId || Number.isNaN(lojaId)) {
    throw new AppError("lojaId é obrigatório e deve ser um número.", 400);
  }

  if (!tipoManutencao) {
    throw new AppError("tipoManutencao é obrigatório.", 400);
  }

  validarTipoManutencao(tipoManutencao);

  if (Number.isNaN(quantidade) || quantidade <= 0) {
    throw new AppError("A quantidade deve ser maior que zero.", 400);
  }

  validarAcessoLoja(contextoUsuario, lojaId);

  if (!observacao) {
    throw new AppError(
      "A observação é obrigatória para justificar a manutenção.",
      400,
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const loja = await manutencoesRepository.buscarLojaAtivaParaAtualizar(
      client,
      lojaId,
    );

    if (!loja) {
      throw new AppError("Loja não encontrada ou inativa.", 404);
    }

    const estoque = await manutencoesRepository.buscarEstoqueLojaParaAtualizar(
      client,
      lojaId,
    );

    if (!estoque) {
      throw new AppError("Estoque da loja não encontrado.", 404);
    }

    const saldoAnterior = Number(estoque.estoque_atual);
    const saldoPosterior = calcularSaldoPosterior(
      saldoAnterior,
      tipoManutencao,
      quantidade,
    );

    if (saldoPosterior < 0) {
      throw new AppError(
        "A manutenção não pode deixar o estoque negativo.",
        400,
      );
    }

    const manutencaoCriada = await manutencoesRepository.criarManutencao(
      client,
      {
        lojaId,
        usuarioId,
        tipoManutencao,
        quantidade,
        observacao,
      },
    );

    const tipoMovimentacao = obterTipoMovimentacao(tipoManutencao);

    await manutencoesRepository.atualizarEstoqueLoja(
      client,
      lojaId,
      saldoPosterior,
    );

    await manutencoesRepository.criarMovimentacaoManutencao(client, {
      lojaId,
      usuarioId,
      manutencaoId: manutencaoCriada.id,
      tipoMovimentacao,
      quantidade,
      saldoAnterior,
      saldoPosterior,
      observacao,
    });

    await client.query("COMMIT");

    return {
      id: manutencaoCriada.id,
      lojaId: manutencaoCriada.loja_id,
      usuarioId: manutencaoCriada.usuario_id,
      tipoManutencao: manutencaoCriada.tipo_manutencao,
      quantidade: Number(manutencaoCriada.quantidade),
      observacao: manutencaoCriada.observacao,
      saldoAnterior,
      saldoPosterior,
      criadoEm: manutencaoCriada.criado_em,
      mensagem: "Manutenção registrada com sucesso.",
    };
  } catch (erro) {
    await client.query("ROLLBACK");
    throw erro;
  } finally {
    client.release();
  }
}

module.exports = {
  listarManutencoes,
  registrarManutencao,
};
