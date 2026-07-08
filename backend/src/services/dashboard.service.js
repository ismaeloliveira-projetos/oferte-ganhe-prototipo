const dashboardRepository = require("../repositories/dashboard.repository");

function montarInsights(dados) {
  const insights = [];

  if (dados.totalCritico > 0) {
    insights.push({
      titulo: "Estoque crítico",
      descricao: `Existem ${dados.totalCritico} loja(s) abaixo ou no limite mínimo de estoque.`,
    });
  }

  if (dados.totalAtencao > 0) {
    insights.push({
      titulo: "Atenção",
      descricao: `Existem ${dados.totalAtencao} loja(s) abaixo do estoque recomendado.`,
    });
  }

  if (dados.enviosPendentes > 0) {
    insights.push({
      titulo: "Envios pendentes",
      descricao: `Existem ${dados.enviosPendentes} remessa(s) aguardando recebimento.`,
    });
  }

  insights.push({
    titulo: "Movimentação",
    descricao: `O sistema possui ${dados.totalRecebimentos} recebimento(s) e ${dados.totalManutencoes} manutenção(ões) registradas.`,
  });

  if (
    dados.totalCritico === 0 &&
    dados.totalAtencao === 0 &&
    dados.enviosPendentes === 0
  ) {
    insights.push({
      titulo: "Situação estável",
      descricao: "Nenhuma pendência crítica identificada no momento.",
    });
  }

  return insights;
}

function mapearLojasAtencao(lojas) {
  return lojas.map(function (loja) {
    return {
      codigoLoja: loja.codigo_loja,
      nomeLoja: loja.nome_loja,
      estoqueAtual: Number(loja.estoque_atual),
      estoqueMinimo: Number(loja.quantidade_minima),
      estoqueRecomendado: Number(loja.quantidade_recomendada),
      statusEstoque: loja.status_estoque,
    };
  });
}

function mapearHistoricoEnvios(historico) {
  return historico.map(function (item) {
    return {
      mes: item.mes,
      totalEnviado: Number(item.total_enviado),
    };
  });
}

async function buscarResumoDashboard(contextoUsuario) {
  const enviosMesResultado =
    await dashboardRepository.contarEnviosMes(contextoUsuario);
  const cards = await dashboardRepository.buscarCardsDashboard(contextoUsuario);
  const status = await dashboardRepository.buscarStatusLojas(contextoUsuario);
  const lojasAtencao =
    await dashboardRepository.buscarLojasComAtencao(contextoUsuario);
  const enviosPendentesResultado =
    await dashboardRepository.contarEnviosPendentes(contextoUsuario);
  const recebimentosResultado =
    await dashboardRepository.contarRecebimentos(contextoUsuario);
  const manutencoesResultado =
    await dashboardRepository.contarManutencoes(contextoUsuario);
  const historicoEnvios =
    await dashboardRepository.buscarHistoricoEnvios(contextoUsuario);

  const totalLojas = Number(cards.totalLojas ?? 0);
  const totalEstoque = Number(cards.totalEstoque ?? 0);
  const lojasCriticas = Number(cards.lojasCriticas ?? 0);
  const enviosMes = Number(enviosMesResultado.enviosMes ?? 0);

  const totalCritico = Number(status.critico);
  const totalAtencao = Number(status.atencao);
  const totalNormal = Number(status.normal);

  const enviosPendentes = Number(enviosPendentesResultado.total);
  const totalRecebimentos = Number(recebimentosResultado.total);
  const totalManutencoes = Number(manutencoesResultado.total);

  const insights = montarInsights({
    totalCritico,
    totalAtencao,
    enviosPendentes,
    totalRecebimentos,
    totalManutencoes,
  });

  return {
    totalLojas,
    totalEstoque,
    lojasCriticas,
    enviosMes,
    statusLojas: {
      critico: totalCritico,
      atencao: totalAtencao,
      normal: totalNormal,
    },
    lojasAtencao: mapearLojasAtencao(lojasAtencao),
    historicoEnvios: mapearHistoricoEnvios(historicoEnvios),
    insights,
  };
}

module.exports = {
  buscarResumoDashboard,
};
