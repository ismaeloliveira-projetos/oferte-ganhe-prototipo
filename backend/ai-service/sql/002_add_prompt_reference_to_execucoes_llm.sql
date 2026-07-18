-- Script 002: adiciona referência ao prompt usado na execução LLM


ALTER TABLE ia.execucoes_llm
ADD COLUMN IF NOT EXISTS prompt_id INTEGER REFERENCES ia.prompts(id);

ALTER TABLE ia.execucoes_llm
ADD COLUMN IF NOT EXISTS prompt_versao INTEGER;

CREATE INDEX IF NOT EXISTS idx_execucoes_llm_prompt_id
ON ia.execucoes_llm(prompt_id);