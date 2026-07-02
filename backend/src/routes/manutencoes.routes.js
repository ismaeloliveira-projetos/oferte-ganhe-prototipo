const { pool } = require("../config/database");
const { enviarJson, lerCorpoJson } = require("../utils/http");

const TIPOS_ENTRADA = ["AJUSTE_ENTRADA"];
const TIPOS_SAIDA = ["AJUSTE_SAIDA", "AVARIA", "EXTRAVIO"];

function obterTipoMovimentacao(tipoManutencao) {
  if (tipoManutencao === "AJUSTE_ENTRADA") {
    return "MANUTENCAO_ENTRADA";
  }

  if (tipoManutencao === "AJUSTE_SAIDA") {
    return "MANUTENCAO_SAIDA";
  }

  return tipoManutencao;
}

async function tratarRotasManutencoes(req, res, url) {
  // Rota para listar todas as manutenções de talões
  if (req.method === "GET" && url.pathname === "/api/manutencoes") {
    const resultado = await pool.query(`
    SELECT
      m.id AS id,
      m.loja_id AS "lojaId",
      l.codigo_loja AS "codigoLoja",
      l.nome_loja AS "nomeLoja",
      m.usuario_id AS "usuarioId",
      m.tipo_manutencao AS "tipoManutencao",
      m.quantidade AS quantidade,
      m.observacao AS observacao,
      m.criado_em AS "criadoEm"
    FROM manutencoes_taloes m
    JOIN lojas l
      ON l.id = m.loja_id
    ORDER BY m.criado_em DESC
  `);

    enviarJson(res, 200, resultado.rows);
    return true;
  }

  // Rota para criar uma manutenção de talões
  if (req.method === "POST" && url.pathname === "/api/manutencoes") {
    const dados = await lerCorpoJson(req);

    const lojaId = Number(dados.lojaId);
    const usuarioId = dados.usuarioId ? Number(dados.usuarioId) : null;
    const tipoManutencao = String(dados.tipoManutencao || "").trim();
    const quantidade = Number(dados.quantidade);
    const observacao = String(dados.observacao || "").trim();

    if (!lojaId || Number.isNaN(lojaId)) {
      enviarJson(res, 400, {
        erro: "lojaId é obrigatório e deve ser um número.",
      });
      return true;
    }

    if (!tipoManutencao) {
      enviarJson(res, 400, {
        erro: "tipoManutencao é obrigatório.",
      });
      return true;
    }

    const tipoEhEntrada = TIPOS_ENTRADA.includes(tipoManutencao);
    const tipoEhSaida = TIPOS_SAIDA.includes(tipoManutencao);

    if (!tipoEhEntrada && !tipoEhSaida) {
      enviarJson(res, 400, {
        erro: "Tipo de manutenção inválido ou ainda não suportado.",
      });
      return true;
    }

    if (Number.isNaN(quantidade) || quantidade <= 0) {
      enviarJson(res, 400, {
        erro: "A quantidade deve ser maior que zero.",
      });
      return true;
    }

    if (!observacao) {
      enviarJson(res, 400, {
        erro: "A observação é obrigatória para justificar a manutenção.",
      });
      return true;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resultadoLoja = await client.query(
        `
          SELECT id
          FROM lojas
          WHERE id = $1
            AND ativo = true
          FOR UPDATE
        `,
        [lojaId],
      );

      if (resultadoLoja.rows.length === 0) {
        await client.query("ROLLBACK");

        enviarJson(res, 404, {
          erro: "Loja não encontrada ou inativa.",
        });

        return true;
      }

      const resultadoEstoque = await client.query(
        `
          SELECT estoque_atual
          FROM estoques_lojas
          WHERE loja_id = $1
          FOR UPDATE
        `,
        [lojaId],
      );

      if (resultadoEstoque.rows.length === 0) {
        await client.query("ROLLBACK");

        enviarJson(res, 404, {
          erro: "Estoque da loja não encontrado.",
        });

        return true;
      }

      const saldoAnterior = Number(resultadoEstoque.rows[0].estoque_atual);

      let saldoPosterior;

      if (tipoEhEntrada) {
        saldoPosterior = saldoAnterior + quantidade;
      } else {
        saldoPosterior = saldoAnterior - quantidade;
      }

      if (saldoPosterior < 0) {
        await client.query("ROLLBACK");

        enviarJson(res, 400, {
          erro: "A manutenção não pode deixar o estoque negativo.",
        });

        return true;
      }

      const resultadoManutencao = await client.query(
        `
    INSERT INTO manutencoes_taloes (
      loja_id,
      usuario_id,
      tipo_manutencao,
      quantidade,
      observacao,
      criado_em
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      NOW()
    )
    RETURNING
      id,
      loja_id,
      usuario_id,
      tipo_manutencao,
      quantidade,
      observacao,
      criado_em
  `,
        [lojaId, usuarioId, tipoManutencao, quantidade, observacao],
      );

      const manutencaoCriada = resultadoManutencao.rows[0];
      const tipoMovimentacao = obterTipoMovimentacao(tipoManutencao);

      await client.query(
        `
          UPDATE estoques_lojas
          SET
            estoque_atual = $1,
            atualizado_em = NOW()
          WHERE loja_id = $2
        `,
        [saldoPosterior, lojaId],
      );

      await client.query(
        `
    INSERT INTO movimentacoes_estoque (
      loja_id,
      usuario_id,
      recebimento_id,
      manutencao_id,
      tipo_movimentacao,
      quantidade,
      saldo_anterior,
      saldo_posterior,
      observacao,
      criado_em
    )
    VALUES (
      $1,
      $2,
      NULL,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      NOW()
    )
  `,
        [
          lojaId,
          usuarioId,
          manutencaoCriada.id,
          tipoMovimentacao,
          quantidade,
          saldoAnterior,
          saldoPosterior,
          observacao,
        ],
      );
      await client.query("COMMIT");

      enviarJson(res, 201, {
        id: manutencaoCriada.id,
        lojaId: manutencaoCriada.loja_id,
        usuarioId: manutencaoCriada.usuario_id,
        tipoManutencao: manutencaoCriada.tipo_manutencao,
        quantidade: manutencaoCriada.quantidade,
        observacao: manutencaoCriada.observacao,
        saldoAnterior,
        saldoPosterior,
        criadoEm: manutencaoCriada.criado_em,
        mensagem: "Manutenção registrada com sucesso.",
      });

      return true;
    } catch (erro) {
      await client.query("ROLLBACK");
      throw erro;
    } finally {
      client.release();
    }
  }

  return false;
}

module.exports = {
  tratarRotasManutencoes,
};
