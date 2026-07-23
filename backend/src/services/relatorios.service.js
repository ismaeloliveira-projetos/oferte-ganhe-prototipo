const usuariosService = require("./usuarios.service");
const perfisService = require("./perfis.service");
const lojasService = require("./lojas.service");
const estoquesService = require("./estoques.service");
const enviosService = require("./envios.service");
const recebimentosService = require("./recebimentos.service");
const manutencoesService = require("./manutencoes.service");
const relatoriosExportadosRepository = require("../repositories/relatorios-exportados.repository");

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

async function exportarCsvComPython(tipo, dados) {
  const aiServiceUrl = process.env.AI_SERVICE_URL;
  const iaInternalKey = process.env.AI_SERVICE_INTERNAL_KEY;

  if (!aiServiceUrl) {
    const erro = new Error("AI_SERVICE_URL não configurada no backend Node.");
    erro.statusCode = 500;
    throw erro;
  }

  if (!iaInternalKey) {
    const erro = new Error(
      "AI_SERVICE_INTERNAL_KEY não configurada no backend Node.",
    );
    erro.statusCode = 500;
    throw erro;
  }

  const resposta = await fetch(`${aiServiceUrl}/relatorios/exportar/csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-internal-key": iaInternalKey,
    },
    body: JSON.stringify({
      tipo,
      dados,
    }),
  });

  if (!resposta.ok) {
    const textoErro = await resposta.text();

    const erro = new Error(`Erro ao gerar relatório no Python: ${textoErro}`);

    erro.statusCode = resposta.status;
    throw erro;
  }

  const arrayBuffer = await resposta.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const contentType =
    resposta.headers.get("content-type") || "text/csv; charset=utf-8";

  const contentDisposition =
    resposta.headers.get("content-disposition") ||
    `attachment; filename="relatorio-${tipo}.csv"`;

  return {
    buffer,
    contentType,
    contentDisposition,
  };
}

function extrairNomeArquivoDoContentDisposition(
  contentDisposition,
  nomePadrao,
) {
  if (!contentDisposition) {
    return nomePadrao;
  }

  const match = contentDisposition.match(/filename="([^"]+)"/);

  if (!match) {
    return nomePadrao;
  }

  return match[1];
}

async function registrarHistoricoExportacao(dados) {
  return await relatoriosExportadosRepository.registrarExportacaoRelatorio({
    usuarioId: dados.usuarioId,
    tipoExportacao: dados.tipoExportacao,
    arquivoGerado: dados.arquivoGerado,
    filtros: dados.filtros || {},
  });
}

async function listarHistoricoExportacoesRelatorios() {
  return await relatoriosExportadosRepository.listarExportacoesRelatorios(50);
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
  exportarCsvComPython,
  extrairNomeArquivoDoContentDisposition,
  registrarHistoricoExportacao,
  listarHistoricoExportacoesRelatorios,
};
