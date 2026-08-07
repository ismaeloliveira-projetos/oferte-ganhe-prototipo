BEGIN;

ALTER TABLE movimentacoes_estoque
DROP CONSTRAINT IF EXISTS chk_movimentacao_origem_unica;

ALTER TABLE movimentacoes_estoque
ADD CONSTRAINT chk_movimentacao_origem_unica
CHECK (
    num_nonnulls(
        recebimento_id,
        manutencao_id,
        consumo_id
    ) = 1
);

COMMIT;