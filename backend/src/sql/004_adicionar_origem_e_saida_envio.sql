BEGIN;

-- A Loja Sede (id 1) deve existir e estar ativa.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM lojas
        WHERE id = 1
          AND ativo = true
    ) THEN
        RAISE EXCEPTION
            'Loja Sede (id 1) não encontrada ou inativa.';
    END IF;
END $$;

-- Registra de qual loja cada envio saiu.
ALTER TABLE envios_taloes
ADD COLUMN IF NOT EXISTS loja_origem_id INTEGER
    REFERENCES lojas(id);

-- Os envios históricos para outras lojas saíram da Sede.
-- Envios antigos recebidos pela própria Sede permanecem sem origem registrada.
UPDATE envios_taloes
SET loja_origem_id = 1
WHERE loja_origem_id IS NULL
  AND loja_id <> 1;

ALTER TABLE envios_taloes
DROP CONSTRAINT IF EXISTS chk_envio_origem_destino_diferentes;

ALTER TABLE envios_taloes
ADD CONSTRAINT chk_envio_origem_destino_diferentes
CHECK (
    loja_origem_id IS NULL
    OR loja_origem_id <> loja_id
);

CREATE INDEX IF NOT EXISTS idx_envios_taloes_loja_origem_id
ON envios_taloes (loja_origem_id);

-- Vincula a movimentação de saída ao envio que a originou.
ALTER TABLE movimentacoes_estoque
ADD COLUMN IF NOT EXISTS envio_id INTEGER
    REFERENCES envios_taloes(id);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_envio_id
ON movimentacoes_estoque (envio_id);

-- Uma movimentação deve possuir exatamente uma origem.
ALTER TABLE movimentacoes_estoque
DROP CONSTRAINT IF EXISTS chk_movimentacao_origem_unica;

ALTER TABLE movimentacoes_estoque
ADD CONSTRAINT chk_movimentacao_origem_unica
CHECK (
    num_nonnulls(
        recebimento_id,
        manutencao_id,
        consumo_id,
        envio_id
    ) = 1
);

-- Inclui a saída gerada por um envio.
ALTER TABLE movimentacoes_estoque
DROP CONSTRAINT IF EXISTS chk_movimentacoes_tipo;

ALTER TABLE movimentacoes_estoque
ADD CONSTRAINT chk_movimentacoes_tipo
CHECK (
    tipo_movimentacao IN (
        'RECEBIMENTO',
        'MANUTENCAO_ENTRADA',
        'MANUTENCAO_SAIDA',
        'AVARIA',
        'EXTRAVIO',
        'CORRECAO',
        'CONSUMO_UTILIZACAO',
        'ENVIO_SAIDA'
    )
);

COMMIT;