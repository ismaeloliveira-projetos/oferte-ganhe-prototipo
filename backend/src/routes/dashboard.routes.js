const { query } = require("../config/database");
const { enviarJson } = require("../utils/http");

async function tratarRotasDashboard(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/dashboard/resumo") {
    await buscarResumoDashboard(req, res);
    return true;
  }

  return false;
}

async function buscarResumoDashboard(req, res) {
  try {
    const resultadoCards = await query(`
      SELECT
        (
          SELECT COUNT(*)
          FROM lojas
          WHERE ativo = true
        ) AS total_lojas,

        (
          SELECT COALESCE(SUM(e.estoque_atual), 0)
          FROM lojas l
          LEFT JOIN estoques_lojas e
            ON e.loja_id = l.id
          WHERE l.ativo = true
        ) AS total_estoque,

        (
          SELECT COUNT(*)
          FROM lojas l
          INNER JOIN estoques_lojas e
            ON e.loja_id = l.id
          WHERE l.ativo = true
            AND e.estoque_atual <= l.quantidade_minima
        ) AS lojas_criticas,

        (
          SELECT COUNT(*)
          FROM envios_taloes
          WHERE DATE_TRUNC('month', data_envio) = DATE_TRUNC('month', CURRENT_DATE)
        ) AS envios_mes;
    `);

    const resultadoStatus = await query(`
      SELECT
        COUNT(*) FILTER (
          WHERE e.estoque_atual <= l.quantidade_minima
        ) AS critico,

        COUNT(*) FILTER (
          WHERE e.estoque_atual > l.quantidade_minima
          AND e.estoque_atual < l.quantidade_recomendada
        ) AS atencao,

        COUNT(*) FILTER (
          WHERE e.estoque_atual >= l.quantidade_recomendada
        ) AS normal
      FROM lojas l
      INNER JOIN estoques_lojas e
        ON e.loja_id = l.id
      WHERE l.ativo = true;
    `);

    const resultadoLojasAtencao = await query(`
      SELECT
        l.codigo_loja AS codigo_loja,
        l.nome_loja AS nome_loja,
        e.estoque_atual,
        l.quantidade_minima,
        l.quantidade_recomendada,
        CASE
          WHEN e.estoque_atual <= l.quantidade_minima THEN 'Crítico'
          WHEN e.estoque_atual < l.quantidade_recomendada THEN 'Atenção'
          ELSE 'Normal'
        END AS status_estoque
      FROM lojas l
      INNER JOIN estoques_lojas e
        ON e.loja_id = l.id
      WHERE l.ativo = true
        AND e.estoque_atual < l.quantidade_recomendada
      ORDER BY
        CASE
          WHEN e.estoque_atual <= l.quantidade_minima THEN 1
          ELSE 2
        END,
        e.estoque_atual ASC;
    `);

    const resultadoEnviosPendentes = await query(`
      SELECT COUNT(*) AS total
      FROM envios_taloes
      WHERE status = 'PENDENTE';
    `);

    const resultadoRecebimentos = await query(`
      SELECT COUNT(*) AS total
      FROM recebimentos_taloes;
    `);

    const resultadoManutencoes = await query(`
      SELECT COUNT(*) AS total
      FROM manutencoes_taloes;
    `);

    const resultadoHistoricoEnvios = await query(`
      SELECT
        TO_CHAR(data_envio, 'MM/YYYY') AS mes,
        COALESCE(SUM(quantidade_enviada), 0) AS total_enviado
      FROM envios_taloes
      WHERE data_envio >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(data_envio, 'MM/YYYY'), DATE_TRUNC('month', data_envio)
      ORDER BY DATE_TRUNC('month', data_envio);
    `);

    const cards = resultadoCards.rows[0];
    const status = resultadoStatus.rows[0];

    const totalLojas = Number(cards.total_lojas);
    const totalEstoque = Number(cards.total_estoque);
    const lojasCriticas = Number(cards.lojas_criticas);
    const enviosMes = Number(cards.envios_mes);

    const totalCritico = Number(status.critico);
    const totalAtencao = Number(status.atencao);
    const totalNormal = Number(status.normal);

    const enviosPendentes = Number(resultadoEnviosPendentes.rows[0].total);
    const totalRecebimentos = Number(resultadoRecebimentos.rows[0].total);
    const totalManutencoes = Number(resultadoManutencoes.rows[0].total);

    const insights = [];

    if (totalCritico > 0) {
      insights.push({
        titulo: "Estoque crítico",
        descricao: `Existem ${totalCritico} loja(s) abaixo ou no limite mínimo de estoque.`,
      });
    }

    if (totalAtencao > 0) {
      insights.push({
        titulo: "Atenção",
        descricao: `Existem ${totalAtencao} loja(s) abaixo do estoque recomendado.`,
      });
    }

    if (enviosPendentes > 0) {
      insights.push({
        titulo: "Envios pendentes",
        descricao: `Existem ${enviosPendentes} remessa(s) aguardando recebimento.`,
      });
    }

    insights.push({
      titulo: "Movimentação",
      descricao: `O sistema possui ${totalRecebimentos} recebimento(s) e ${totalManutencoes} manutenção(ões) registradas.`,
    });

    if (totalCritico === 0 && totalAtencao === 0 && enviosPendentes === 0) {
      insights.push({
        titulo: "Situação estável",
        descricao: "Nenhuma pendência crítica identificada no momento.",
      });
    }

    enviarJson(res, 200, {
      totalLojas,
      totalEstoque,
      lojasCriticas,
      enviosMes,
      statusLojas: {
        critico: totalCritico,
        atencao: totalAtencao,
        normal: totalNormal,
      },
      lojasAtencao: resultadoLojasAtencao.rows.map(function (loja) {
        return {
          codigoLoja: loja.codigo_loja,
          nomeLoja: loja.nome_loja,
          estoqueAtual: Number(loja.estoque_atual),
          estoqueMinimo: Number(loja.quantidade_minima),
          estoqueRecomendado: Number(loja.quantidade_recomendada),
          statusEstoque: loja.status_estoque,
        };
      }),
      historicoEnvios: resultadoHistoricoEnvios.rows.map(function (item) {
        return {
          mes: item.mes,
          totalEnviado: Number(item.total_enviado),
        };
      }),
      insights,
    });
  } catch (erro) {
    console.error("Erro ao buscar resumo do dashboard:", erro);

    enviarJson(res, 500, {
      mensagem: "Erro interno ao buscar resumo do dashboard.",
    });
  }
}

module.exports = {
  tratarRotasDashboard,
};
