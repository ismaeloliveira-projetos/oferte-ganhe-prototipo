async function solicitarAnaliseOperacionalIA() {
  return await apiFetch("/api/ia/insights/analises/operacional", {
    method: "POST",
  });
}

function escaparHtmlAnaliseIA(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarTextoAnaliseIA(texto) {
  return escaparHtmlAnaliseIA(texto)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function configurarBotaoAnaliseOperacionalIA(idBotao, idResultado) {
  const botao = document.getElementById(idBotao);
  const resultado = document.getElementById(idResultado);

  if (!botao || !resultado || botao.dataset.configurado === "true") {
    return;
  }

  botao.dataset.configurado = "true";

  botao.addEventListener("click", async function () {
    const textoOriginal = botao.textContent;

    try {
      botao.disabled = true;
      botao.textContent = "Gerando análise...";

      resultado.innerHTML = `
        <div class="insight-item">
          <strong>Analisando dados:</strong>
          A IA está avaliando a previsão de estoque e as anomalias operacionais.
        </div>
      `;

      const resposta = await solicitarAnaliseOperacionalIA();

      resultado.innerHTML = `
        <div class="insight-item">
          <strong>Análise operacional da IA:</strong>
          <div>${formatarTextoAnaliseIA(resposta.insight)}</div>
        </div>
      `;
    } catch (erro) {
      console.error("Erro ao gerar análise operacional da IA:", erro);

      resultado.innerHTML = `
        <div class="insight-item">
          <strong>Erro ao gerar análise:</strong>
          ${escaparHtmlAnaliseIA(
            erro.message || "Não foi possível comunicar com a IA.",
          )}
        </div>
      `;
    } finally {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  });
}
