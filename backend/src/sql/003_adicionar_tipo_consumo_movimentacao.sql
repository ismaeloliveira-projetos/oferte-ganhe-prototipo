BEGIN;

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
        'CONSUMO_UTILIZACAO'
    )
);

COMMIT;