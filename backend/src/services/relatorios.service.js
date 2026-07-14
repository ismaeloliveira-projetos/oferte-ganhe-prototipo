const usuariosService = require("./usuarios.service");
const perfisService = require("./perfis.service");
const lojasService = require("./lojas.service");
const estoquesService = require("./estoques.service");
const enviosService = require("./envios.service");
const recebimentosService = require("./recebimentos.service");
const manutencoesService = require("./manutencoes.service");

// Este service consolida relatórios em JSON usando os services já existentes da API.
// Futuramente, a geração de relatórios analíticos e exportações CSV/Excel
// pode ser evoluída com Python e pandas.
function montarRelatorio(nome, dados) {
  return {
    relatorio: nome,
    totalRegistros: Array.isArray(dados) ? dados.length : 0,
    geradoEm: new Date().toISOString(),
    dados,
  };
}

async function gerarRelatorioUsuarios() {
  const usuarios = await usuariosService.listarUsuarios();

  return montarRelatorio("usuarios", usuarios);
}

async function gerarRelatorioPerfis() {
  const perfis = await perfisService.listarPerfis();

  return montarRelatorio("perfis", perfis);
}

async function gerarRelatorioLojas(contextoUsuario) {
  const lojas = await lojasService.listarLojas(contextoUsuario);

  return montarRelatorio("lojas", lojas);
}

async function gerarRelatorioEstoque(contextoUsuario) {
  const estoques = await estoquesService.listarEstoques(contextoUsuario);

  return montarRelatorio("estoque", estoques);
}

async function gerarRelatorioEnvios(contextoUsuario) {
  const envios = await enviosService.listarEnvios(contextoUsuario);

  return montarRelatorio("envios", envios);
}

async function gerarRelatorioRecebimentos(contextoUsuario) {
  const recebimentos =
    await recebimentosService.listarRecebimentos(contextoUsuario);

  return montarRelatorio("recebimentos", recebimentos);
}

async function gerarRelatorioManutencoes(contextoUsuario) {
  const manutencoes =
    await manutencoesService.listarManutencoes(contextoUsuario);

  return montarRelatorio("manutencoes", manutencoes);
}

async function gerarRelatorioMovimentacoes(contextoUsuario) {
  const movimentacoes = await estoquesService.listarMovimentacoes(
    {},
    contextoUsuario,
  );

  return montarRelatorio("movimentacoes_estoque", movimentacoes);
}

async function gerarResumoRelatorios(contextoUsuario) {
  const [
    usuarios,
    perfis,
    lojas,
    estoques,
    envios,
    recebimentos,
    manutencoes,
    movimentacoes,
  ] = await Promise.all([
    usuariosService.listarUsuarios(),
    perfisService.listarPerfis(),
    lojasService.listarLojas(contextoUsuario),
    estoquesService.listarEstoques(contextoUsuario),
    enviosService.listarEnvios(contextoUsuario),
    recebimentosService.listarRecebimentos(contextoUsuario),
    manutencoesService.listarManutencoes(contextoUsuario),
    estoquesService.listarMovimentacoes({}, contextoUsuario),
  ]);

  return {
    relatorio: "resumo",
    geradoEm: new Date().toISOString(),
    totais: {
      usuarios: usuarios.length,
      perfis: perfis.length,
      lojas: lojas.length,
      estoques: estoques.length,
      envios: envios.length,
      recebimentos: recebimentos.length,
      manutencoes: manutencoes.length,
      movimentacoes: movimentacoes.length,
    },
  };
}

module.exports = {
  gerarRelatorioUsuarios,
  gerarRelatorioPerfis,
  gerarRelatorioLojas,
  gerarRelatorioEstoque,
  gerarRelatorioEnvios,
  gerarRelatorioRecebimentos,
  gerarRelatorioManutencoes,
  gerarRelatorioMovimentacoes,
  gerarResumoRelatorios,
};
