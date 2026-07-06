const usuariosRepository = require("../repositories/usuarios.repository");
const AppError = require("../utils/AppError");
const { gerarHashSenha } = require("../utils/criptografia");

function validarEmail(email) {
  return String(email).includes("@") && String(email).includes(".");
}

function mapearUsuarioResposta(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    matricula: usuario.matricula,
    email: usuario.email,
    ativo: usuario.ativo,
    criadoEm: usuario.criado_em || usuario.criadoEm,
  };
}

async function listarUsuarios() {
  const usuarios = await usuariosRepository.listarUsuariosAtivos();

  return usuarios.map(mapearUsuarioResposta);
}

async function cadastrarUsuario(dados) {
  const nome = String(dados.nome || "").trim();
  const matricula = String(dados.matricula || "").trim();
  const email = String(dados.email || "")
    .trim()
    .toLowerCase();
  const senha = String(dados.senha || "").trim();

  if (!nome) {
    throw new AppError("Nome é obrigatório.", 400);
  }

  if (!matricula) {
    throw new AppError("Matrícula é obrigatória.", 400);
  }

  if (!email) {
    throw new AppError("E-mail é obrigatório.", 400);
  }

  if (!validarEmail(email)) {
    throw new AppError("E-mail inválido.", 400);
  }

  if (!senha) {
    throw new AppError("Senha é obrigatória.", 400);
  }

  if (senha.length < 6) {
    throw new AppError("Senha deve ter pelo menos 6 caracteres.", 400);
  }

  const emailExistente = await usuariosRepository.buscarUsuarioPorEmail(email);

  if (emailExistente) {
    throw new AppError("Já existe um usuário cadastrado com esse e-mail.", 409);
  }

  const matriculaExistente =
    await usuariosRepository.buscarUsuarioPorMatricula(matricula);

  if (matriculaExistente) {
    throw new AppError(
      "Já existe um usuário cadastrado com essa matrícula.",
      409,
    );
  }

  const senhaHash = gerarHashSenha(senha);

  const usuarioCriado = await usuariosRepository.criarUsuario({
    nome,
    matricula,
    email,
    senhaHash,
  });

  return mapearUsuarioResposta(usuarioCriado);
}

async function atualizarUsuario(idParametro, dados) {
  const id = Number(idParametro);

  if (Number.isNaN(id)) {
    throw new AppError("ID do usuário deve ser um número.", 400);
  }

  const nome = String(dados.nome || "").trim();
  const matricula = String(dados.matricula || "").trim();
  const email = String(dados.email || "")
    .trim()
    .toLowerCase();

  if (!nome) {
    throw new AppError("Nome é obrigatório.", 400);
  }

  if (!matricula) {
    throw new AppError("Matrícula é obrigatória.", 400);
  }

  if (!email) {
    throw new AppError("E-mail é obrigatório.", 400);
  }

  if (!validarEmail(email)) {
    throw new AppError("E-mail inválido.", 400);
  }

  const usuarioExistente = await usuariosRepository.buscarUsuarioPorId(id);

  if (!usuarioExistente) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  const emailDeOutroUsuario =
    await usuariosRepository.buscarOutroUsuarioPorEmail(email, id);

  if (emailDeOutroUsuario) {
    throw new AppError("Já existe outro usuário com esse e-mail.", 409);
  }

  const matriculaDeOutroUsuario =
    await usuariosRepository.buscarOutroUsuarioPorMatricula(matricula, id);

  if (matriculaDeOutroUsuario) {
    throw new AppError("Já existe outro usuário com essa matrícula.", 409);
  }

  const usuarioAtualizado = await usuariosRepository.atualizarUsuarioPorId(id, {
    nome,
    matricula,
    email,
  });

  return mapearUsuarioResposta(usuarioAtualizado);
}

async function inativarUsuario(idParametro) {
  const id = Number(idParametro);

  if (Number.isNaN(id)) {
    throw new AppError("ID do usuário deve ser um número.", 400);
  }

  const usuarioInativado = await usuariosRepository.inativarUsuarioPorId(id);

  if (!usuarioInativado) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  return {
    ...mapearUsuarioResposta(usuarioInativado),
    mensagem: "Usuário inativado com sucesso.",
  };
}

module.exports = {
  listarUsuarios,
  cadastrarUsuario,
  atualizarUsuario,
  inativarUsuario,
};
