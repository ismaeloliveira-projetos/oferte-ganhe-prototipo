const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

async function chamarAiService(caminho, opcoes = {}) {
  const url = `${AI_SERVICE_URL}${caminho}`;

  const resposta = await fetch(url, {
    method: opcoes.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opcoes.headers || {}),
    },
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });

  let dados;

  try {
    dados = await resposta.json();
  } catch (erro) {
    throw new Error(
      `Resposta inválida do serviço de IA. Status HTTP: ${resposta.status}`,
    );
  }

  if (!resposta.ok) {
    const detalhe = dados.detail || dados.mensagem || "Erro não especificado.";
    throw new Error(`Erro no serviço de IA: ${detalhe}`);
  }

  return dados;
}

async function verificarSaudeIa() {
  return chamarAiService("/health");
}

async function gerarInsightRiscoEstoque(contextoUsuarioIa) {
  return chamarAiService("/insights/estoque/risco", {
    method: "POST",
    body: contextoUsuarioIa,
  });
}

function montarContextoUsuarioIa(usuarioContexto) {
  const usuario = usuarioContexto?.usuario || usuarioContexto;

  const lojas =
    usuarioContexto?.lojas ||
    usuarioContexto?.lojasPermitidas ||
    usuarioContexto?.lojas_ids ||
    [];

  const lojasIds = Array.isArray(lojas)
    ? lojas
        .map(function (loja) {
          if (typeof loja === "number") {
            return loja;
          }

          return loja.id || loja.loja_id;
        })
        .filter(function (id) {
          return Number.isInteger(id);
        })
    : [];

  return {
    usuario_id:
      usuario?.id ||
      usuarioContexto?.usuario_id ||
      usuarioContexto?.usuarioId ||
      null,

    acesso_global:
      usuarioContexto?.acessoGlobal || usuarioContexto?.acesso_global || false,

    lojas_ids: lojasIds,
  };
}

async function listarHistoricoInsights(contextoUsuarioIa, limite = 20) {
  return chamarAiService("/insights/historico", {
    method: "POST",
    body: {
      usuario_id: contextoUsuarioIa.usuario_id,
      limite,
    },
  });
}

async function registrarFeedbackInsight(contextoUsuarioIa, feedback) {
  return chamarAiService("/insights/feedback", {
    method: "POST",
    body: {
      usuario_id: contextoUsuarioIa.usuario_id,
      insight_id: feedback.insight_id,
      avaliacao: feedback.avaliacao,
      comentario: feedback.comentario || null,
    },
  });
}

async function obterResumoUsoIa(contextoUsuarioIa) {
  return chamarAiService("/uso/resumo", {
    method: "POST",
    body: {
      usuario_id: contextoUsuarioIa.usuario_id,
    },
  });
}

async function listarLogsIa(contextoUsuarioIa, filtros = {}) {
  return chamarAiService("/logs", {
    method: "POST",
    body: {
      usuario_id: contextoUsuarioIa.usuario_id,
      acesso_global: contextoUsuarioIa.acesso_global,
      nivel: filtros.nivel || null,
      origem: filtros.origem || null,
      limite: filtros.limite || 50,
    },
  });
}

module.exports = {
  verificarSaudeIa,
  gerarInsightRiscoEstoque,
  listarHistoricoInsights,
  registrarFeedbackInsight,
  obterResumoUsoIa,
  listarLogsIa,
  montarContextoUsuarioIa,
};
