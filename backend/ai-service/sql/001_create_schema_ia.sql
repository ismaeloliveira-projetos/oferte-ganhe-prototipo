-- Script 001: criação do schema ia e tabelas iniciais

CREATE SCHEMA IF NOT EXISTS ia;

-- Função padrão para atualizar data_modificacao


CREATE OR REPLACE FUNCTION ia.atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- ia.indicadores
-- Catálogo oficial da Semantic Layer


CREATE TABLE IF NOT EXISTS ia.indicadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL UNIQUE,
    descricao TEXT,
    categoria VARCHAR(80),
    origem_dados TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- ia.resultados_indicadores
-- Histórico de resultados calculados dos indicadores


CREATE TABLE IF NOT EXISTS ia.resultados_indicadores (
    id SERIAL PRIMARY KEY,
    indicador_id INTEGER NOT NULL REFERENCES ia.indicadores(id),
    periodo_inicio DATE,
    periodo_fim DATE,
    filtros JSONB,
    resultado JSONB NOT NULL,
    fonte VARCHAR(100) DEFAULT 'fastapi',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- ia.modelos_llm
-- Modelos de linguagem disponíveis


CREATE TABLE IF NOT EXISTS ia.modelos_llm (
    id SERIAL PRIMARY KEY,
    nome_modelo VARCHAR(160) NOT NULL UNIQUE,
    provedor VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- ia.prompts
-- Prompts versionados


CREATE TABLE IF NOT EXISTS ia.prompts (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    conteudo TEXT NOT NULL,
    versao INTEGER NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nome, versao)
);



-- ia.consultas_ia
-- Solicitações feitas à IA


CREATE TABLE IF NOT EXISTS ia.consultas_ia (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    tipo_consulta VARCHAR(100) NOT NULL,
    pergunta TEXT,
    contexto JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    correlation_id UUID,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalizado_em TIMESTAMP,

    CONSTRAINT chk_consultas_ia_status
    CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'SUCESSO', 'ERRO'))
);



-- ia.execucoes_llm
-- Controle de modelo, tokens, custo e tempo


CREATE TABLE IF NOT EXISTS ia.execucoes_llm (
    id SERIAL PRIMARY KEY,
    consulta_ia_id INTEGER REFERENCES ia.consultas_ia(id),
    modelo VARCHAR(160) NOT NULL,
    provedor VARCHAR(100),
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    custo NUMERIC(12, 6) DEFAULT 0,
    tempo_ms INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCESSO',
    erro TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_execucoes_llm_status
    CHECK (status IN ('SUCESSO', 'ERRO'))
);



-- ia.insights
-- Insights e recomendações gerados pela IA


CREATE TABLE IF NOT EXISTS ia.insights (
    id SERIAL PRIMARY KEY,
    consulta_ia_id INTEGER REFERENCES ia.consultas_ia(id),
    indicador_id INTEGER REFERENCES ia.indicadores(id),
    tipo_insight VARCHAR(100) NOT NULL,
    titulo VARCHAR(180),
    dados_base JSONB,
    resposta TEXT NOT NULL,
    nivel_confianca VARCHAR(30),
    modelo_utilizado VARCHAR(160),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_insights_nivel_confianca
    CHECK (
        nivel_confianca IS NULL
        OR nivel_confianca IN ('BAIXO', 'MEDIO', 'ALTO')
    )
);



-- ia.feedback_respostas
-- Avaliação do usuário sobre respostas da IA


CREATE TABLE IF NOT EXISTS ia.feedback_respostas (
    id SERIAL PRIMARY KEY,
    insight_id INTEGER REFERENCES ia.insights(id),
    usuario_id INTEGER,
    avaliacao VARCHAR(30),
    comentario TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_feedback_avaliacao
    CHECK (
        avaliacao IS NULL
        OR avaliacao IN ('UTIL', 'NAO_UTIL', 'INCORRETA', 'INCOMPLETA')
    )
);



-- ia.logs_ia
-- Logs técnicos e auditoria


CREATE TABLE IF NOT EXISTS ia.logs_ia (
    id SERIAL PRIMARY KEY,
    nivel VARCHAR(20) NOT NULL,
    origem VARCHAR(120),
    mensagem TEXT NOT NULL,
    metadados JSONB,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_logs_ia_nivel
    CHECK (nivel IN ('DEBUG', 'INFO', 'WARN', 'ERROR'))
);



-- Triggers de atualização


DROP TRIGGER IF EXISTS trg_indicadores_atualizado_em ON ia.indicadores;
CREATE TRIGGER trg_indicadores_atualizado_em
BEFORE UPDATE ON ia.indicadores
FOR EACH ROW
EXECUTE FUNCTION ia.atualizar_data_modificacao();


DROP TRIGGER IF EXISTS trg_modelos_llm_atualizado_em ON ia.modelos_llm;
CREATE TRIGGER trg_modelos_llm_atualizado_em
BEFORE UPDATE ON ia.modelos_llm
FOR EACH ROW
EXECUTE FUNCTION ia.atualizar_data_modificacao();


DROP TRIGGER IF EXISTS trg_prompts_atualizado_em ON ia.prompts;
CREATE TRIGGER trg_prompts_atualizado_em
BEFORE UPDATE ON ia.prompts
FOR EACH ROW
EXECUTE FUNCTION ia.atualizar_data_modificacao();



-- Índices


CREATE INDEX IF NOT EXISTS idx_resultados_indicadores_indicador_id
ON ia.resultados_indicadores(indicador_id);

CREATE INDEX IF NOT EXISTS idx_consultas_ia_usuario_id
ON ia.consultas_ia(usuario_id);

CREATE INDEX IF NOT EXISTS idx_consultas_ia_tipo_consulta
ON ia.consultas_ia(tipo_consulta);

CREATE INDEX IF NOT EXISTS idx_consultas_ia_status
ON ia.consultas_ia(status);

CREATE INDEX IF NOT EXISTS idx_execucoes_llm_consulta_ia_id
ON ia.execucoes_llm(consulta_ia_id);

CREATE INDEX IF NOT EXISTS idx_insights_consulta_ia_id
ON ia.insights(consulta_ia_id);

CREATE INDEX IF NOT EXISTS idx_insights_tipo_insight
ON ia.insights(tipo_insight);

CREATE INDEX IF NOT EXISTS idx_logs_ia_nivel
ON ia.logs_ia(nivel);



-- Dados iniciais


INSERT INTO ia.indicadores (
    nome,
    descricao,
    categoria,
    origem_dados
)
VALUES (
    'risco_estoque',
    'Classificação de risco das lojas com base no estoque atual, quantidade mínima e quantidade recomendada.',
    'estoque',
    'lojas, estoques_lojas'
)
ON CONFLICT (nome) DO NOTHING;


INSERT INTO ia.modelos_llm (
    nome_modelo,
    provedor,
    descricao
)
VALUES (
    'openai/gpt-4o-mini',
    'OpenRouter',
    'Modelo utilizado para geração de insights executivos da camada de IA.'
)
ON CONFLICT (nome_modelo) DO NOTHING;


INSERT INTO ia.prompts (
    nome,
    descricao,
    conteudo,
    versao
)
VALUES (
    'insight_risco_estoque',
    'Prompt para geração de insight executivo sobre risco de estoque.',
    'Analise o indicador de risco de estoque fornecido. Gere um insight executivo curto, objetivo e baseado somente nos dados recebidos. Não invente números.',
    1
)
ON CONFLICT (nome, versao) DO NOTHING;