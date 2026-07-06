const { pool } = require("../database/conexao");
const perfisRepository = require("../repositories/perfis.repository");
const AppError = require("../utils/AppError");

function mapearPerfilResposta(perfil) {
  return {
    id: perfil.id,
    nomePerfil: perfil.nome_perfil || perfil.nomePerfil,
    descricao: perfil.descricao,
    nivel: Number(perfil.nivel),
    ativo: perfil.ativo,
    criadoEm: perfil.criado_em || perfil.criadoEm,
    permissoes: perfil.permissoes || [],
  };
}

function validarIdNumerico(valor, nomeCampo) {
  const id = Number(valor);

  if (Number.isNaN(id)) {
    throw new AppError(`${nomeCampo} deve ser um número.`, 400);
  }

  return id;
}

function validarDadosPerfil(dados) {
  const nomePerfil = String(dados.nomePerfil || "").trim();
  const descricao = dados.descricao ? String(dados.descricao).trim() : null;
  const nivel = Number(dados.nivel);
  const permissoes = Array.isArray(dados.permissoes) ? dados.permissoes : [];

  if (!nomePerfil) {
    throw new AppError("Nome do perfil é obrigatório.", 400);
  }

  if (Number.isNaN(nivel) || nivel < 1 || nivel > 4) {
    throw new AppError("O nível deve estar entre 1 e 4.", 400);
  }

  if (permissoes.length === 0) {
    throw new AppError("Selecione pelo menos uma permissão.", 400);
  }

  const permissoesNormalizadas = permissoes.map(function (permissao) {
    return String(permissao).trim();
  });

  return {
    nomePerfil,
    descricao,
    nivel,
    permissoes: permissoesNormalizadas,
  };
}

async function validarPermissoes(permissoesChaves) {
  const permissoesEncontradas =
    await perfisRepository.buscarPermissoesAtivasPorChaves(permissoesChaves);

  if (permissoesEncontradas.length !== permissoesChaves.length) {
    throw new AppError(
      "Uma ou mais permissões selecionadas não existem ou estão inativas.",
      400,
    );
  }

  return permissoesEncontradas;
}

async function listarPerfis() {
  const perfis = await perfisRepository.listarPerfisAtivos();

  return perfis.map(mapearPerfilResposta);
}

async function cadastrarPerfil(dados) {
  const dadosValidados = validarDadosPerfil(dados);

  const perfilExistente = await perfisRepository.buscarPerfilPorNome(
    dadosValidados.nomePerfil,
  );

  if (perfilExistente) {
    throw new AppError("Já existe um perfil cadastrado com esse nome.", 409);
  }

  const permissoesEncontradas = await validarPermissoes(
    dadosValidados.permissoes,
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const perfilCriado = await perfisRepository.criarPerfil(client, {
      nomePerfil: dadosValidados.nomePerfil,
      descricao: dadosValidados.descricao,
      nivel: dadosValidados.nivel,
    });

    await perfisRepository.vincularPermissoesAoPerfil(
      client,
      perfilCriado.id,
      permissoesEncontradas.map(function (permissao) {
        return permissao.id;
      }),
    );

    await client.query("COMMIT");

    return {
      ...mapearPerfilResposta(perfilCriado),
      permissoes: dadosValidados.permissoes,
    };
  } catch (erro) {
    await client.query("ROLLBACK");
    throw erro;
  } finally {
    client.release();
  }
}

async function atualizarPerfil(idParametro, dados) {
  const id = validarIdNumerico(idParametro, "ID do perfil");
  const dadosValidados = validarDadosPerfil(dados);

  const perfilExistente = await perfisRepository.buscarPerfilPorId(id);

  if (!perfilExistente) {
    throw new AppError("Perfil não encontrado.", 404);
  }

  const outroPerfilComMesmoNome =
    await perfisRepository.buscarOutroPerfilPorNome(
      dadosValidados.nomePerfil,
      id,
    );

  if (outroPerfilComMesmoNome) {
    throw new AppError("Já existe outro perfil com esse nome.", 409);
  }

  const permissoesEncontradas = await validarPermissoes(
    dadosValidados.permissoes,
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const perfilAtualizado = await perfisRepository.atualizarPerfilPorId(
      client,
      id,
      {
        nomePerfil: dadosValidados.nomePerfil,
        descricao: dadosValidados.descricao,
        nivel: dadosValidados.nivel,
      },
    );

    await perfisRepository.removerPermissoesDoPerfil(client, id);

    await perfisRepository.vincularPermissoesAoPerfil(
      client,
      id,
      permissoesEncontradas.map(function (permissao) {
        return permissao.id;
      }),
    );

    await client.query("COMMIT");

    return {
      ...mapearPerfilResposta(perfilAtualizado),
      permissoes: dadosValidados.permissoes,
    };
  } catch (erro) {
    await client.query("ROLLBACK");
    throw erro;
  } finally {
    client.release();
  }
}

async function inativarPerfil(idParametro) {
  const id = validarIdNumerico(idParametro, "ID do perfil");

  const perfilInativado = await perfisRepository.inativarPerfilPorId(id);

  if (!perfilInativado) {
    throw new AppError("Perfil não encontrado.", 404);
  }

  return {
    ...mapearPerfilResposta(perfilInativado),
    mensagem: "Perfil inativado com sucesso.",
  };
}

async function listarPerfisDoUsuario(usuarioIdParametro) {
  const usuarioId = validarIdNumerico(usuarioIdParametro, "ID do usuário");

  const usuario = await perfisRepository.buscarUsuarioAtivoPorId(usuarioId);

  if (!usuario) {
    throw new AppError("Usuário não encontrado ou inativo.", 404);
  }

  return await perfisRepository.listarPerfisDoUsuario(usuarioId);
}

async function vincularPerfilAoUsuario(usuarioIdParametro, dados) {
  const usuarioId = validarIdNumerico(usuarioIdParametro, "ID do usuário");
  const perfilId = validarIdNumerico(dados.perfilId, "ID do perfil");

  const usuario = await perfisRepository.buscarUsuarioAtivoPorId(usuarioId);

  if (!usuario) {
    throw new AppError("Usuário não encontrado ou inativo.", 404);
  }

  const perfil = await perfisRepository.buscarPerfilAtivoPorId(perfilId);

  if (!perfil) {
    throw new AppError("Perfil não encontrado ou inativo.", 404);
  }

  const vinculoExistente = await perfisRepository.buscarVinculoUsuarioPerfil(
    usuarioId,
    perfilId,
  );

  if (vinculoExistente) {
    throw new AppError("Usuário já possui esse perfil.", 409);
  }

  const vinculoCriado = await perfisRepository.vincularPerfilAoUsuario(
    usuarioId,
    perfilId,
  );

  return {
    id: vinculoCriado.id,
    usuarioId: vinculoCriado.usuario_id,
    perfilId: vinculoCriado.perfil_id,
    criadoEm: vinculoCriado.criado_em,
    mensagem: "Perfil vinculado ao usuário com sucesso.",
  };
}

async function removerPerfilDoUsuario(usuarioIdParametro, perfilIdParametro) {
  const usuarioId = validarIdNumerico(usuarioIdParametro, "ID do usuário");
  const perfilId = validarIdNumerico(perfilIdParametro, "ID do perfil");

  const vinculoRemovido = await perfisRepository.removerPerfilDoUsuario(
    usuarioId,
    perfilId,
  );

  if (!vinculoRemovido) {
    throw new AppError("Vínculo entre usuário e perfil não encontrado.", 404);
  }

  return {
    id: vinculoRemovido.id,
    usuarioId: vinculoRemovido.usuario_id,
    perfilId: vinculoRemovido.perfil_id,
    mensagem: "Perfil removido do usuário com sucesso.",
  };
}

module.exports = {
  listarPerfis,
  cadastrarPerfil,
  atualizarPerfil,
  inativarPerfil,
  listarPerfisDoUsuario,
  vincularPerfilAoUsuario,
  removerPerfilDoUsuario,
};
