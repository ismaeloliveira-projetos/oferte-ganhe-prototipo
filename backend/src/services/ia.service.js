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

async function gerarInsightRiscoEstoque() {
  return chamarAiService("/insights/estoque/risco");
}

module.exports = {
  verificarSaudeIa,
  gerarInsightRiscoEstoque,
};
