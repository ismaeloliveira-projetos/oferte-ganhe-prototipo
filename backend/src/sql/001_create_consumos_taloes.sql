BEGIN;

CREATE TABLE IF NOT EXISTS consumos_taloes (
    id SERIAL PRIMARY KEY,

    loja_id INTEGER NOT NULL
        REFERENCES lojas(id),

    usuario_id INTEGER NOT NULL
        REFERENCES usuarios(id),

    quantidade INTEGER NOT NULL
        CHECK (quantidade > 0),

    observacao TEXT,

    data_consumo DATE NOT NULL
        DEFAULT CURRENT_DATE,

    criado_em TIMESTAMPTZ NOT NULL
        DEFAULT NOW()
);

ALTER TABLE movimentacoes_estoque
ADD COLUMN IF NOT EXISTS consumo_id INTEGER
    REFERENCES consumos_taloes(id);

CREATE INDEX IF NOT EXISTS idx_consumos_taloes_loja_data
ON consumos_taloes (loja_id, data_consumo DESC);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_consumo_id
ON movimentacoes_estoque (consumo_id);

COMMIT;