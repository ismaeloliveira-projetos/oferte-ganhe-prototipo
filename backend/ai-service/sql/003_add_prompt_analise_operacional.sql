INSERT INTO ia.prompts (
    nome,
    descricao,
    conteudo,
    versao
)
VALUES (
    'insight_analise_operacional',
    'Prompt para gerar insight executivo sobre previsão de estoque e anomalias operacionais.',
    'Analise os dados de previsão de baixa de estoque e de anomalias operacionais. Priorize lojas JA_CRITICO, lojas com RISCO_EM_30_DIAS e anomalias de severidade ALTA. Gere recomendações objetivas baseadas somente nos dados fornecidos. Não invente números, prazos, causas ou ações já executadas.',
    1
)
ON CONFLICT (nome, versao) DO NOTHING;