const perfisRepository = require("../repositories/perfis.repository");
const AppError = require("../utils/AppError");

function mapearPerfilResposta(perfil) {
  return {
    id: perfil.id,
    nomePerfil: perfil.nome_perfil || perfil.nomePerfil,
    descricao: perfil.descricao,
    ativo: perfil.ativo,
    criadoEm: perfil.criado_em || perfil.criadoEm,
  };
}

function validarIdNumerico(valor, nomeCampo) {
  const id = Number(valor);

  if (Number.isNaN(id)) {
    throw new AppError(`${nomeCampo} deve ser um número.`, 400);
  }

  return id;
}

async function listarPerfis() {
  const perfis = await perfisRepository.listarPerfisAtivos();

  return perfis.map(mapearPerfilResposta);
}

async function cadastrarPerfil(dados) {
  const nomePerfil = String(dados.nomePerfil || "").trim();
  const descricao = dados.descricao ? String(dados.descricao).trim() : null;

  if (!nomePerfil) {
    throw new AppError("Nome do perfil é obrigatório.", 400);
  }

  const perfilExistente =
    await perfisRepository.buscarPerfilPorNome(nomePerfil);

  if (perfilExistente) {
    throw new AppError("Já existe um perfil cadastrado com esse nome.", 409);
  }

  const perfilCriado = await perfisRepository.criarPerfil({
    nomePerfil,
    descricao,
  });

  return mapearPerfilResposta(perfilCriado);
}

async function atualizarPerfil(idParametro, dados) {
  const id = validarIdNumerico(idParametro, "ID do perfil");

  const nomePerfil = String(dados.nomePerfil || "").trim();
  const descricao = dados.descricao ? String(dados.descricao).trim() : null;

  if (!nomePerfil) {
    throw new AppError("Nome do perfil é obrigatório.", 400);
  }

  const perfilExistente = await perfisRepository.buscarPerfilPorId(id);

  if (!perfilExistente) {
    throw new AppError("Perfil não encontrado.", 404);
  }

  const outroPerfilComMesmoNome =
    await perfisRepository.buscarOutroPerfilPorNome(nomePerfil, id);

  if (outroPerfilComMesmoNome) {
    throw new AppError("Já existe outro perfil com esse nome.", 409);
  }

  const perfilAtualizado = await perfisRepository.atualizarPerfilPorId(id, {
    nomePerfil,
    descricao,
  });

  return mapearPerfilResposta(perfilAtualizado);
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
