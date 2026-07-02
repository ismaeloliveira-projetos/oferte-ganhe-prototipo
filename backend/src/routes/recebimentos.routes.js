const { pool } = require("../config/database");
const { enviarJson, lerCorpoJson } = require("../utils/http");

async function tratarRotasRecebimentos(req, res, url) {
  // Rota para listar todos os recebimentos de talões
  if (req.method === "GET" && url.pathname === "/api/recebimentos") {
    const resultado = await pool.query(`
    SELECT
      r.id AS id,
      r.envio_id AS "envioId",
      r.loja_id AS "lojaId",
      l.codigo_loja AS "codigoLoja",
      l.nome_loja AS "nomeLoja",
      e.codigo_remessa AS "codigoRemessa",
      e.quantidade_enviada AS "quantidadeEnviada",
      r.quantidade_recebida AS "quantidadeRecebida",
      r.usuario_recebimento_id AS "usuarioRecebimentoId",
      r.data_recebimento AS "dataRecebimento",
      r.observacao AS observacao,
      r.criado_em AS "criadoEm"
    FROM recebimentos_taloes r
    JOIN envios_taloes e
      ON e.id = r.envio_id
    JOIN lojas l
      ON l.id = r.loja_id
    ORDER BY r.data_recebimento DESC
  `);

    enviarJson(res, 200, resultado.rows);
    return true;
  }
  // Rota para criar um recebimento de talões
  if (req.method === "POST" && url.pathname === "/api/recebimentos") {
    const dados = await lerCorpoJson(req);

    const envioId = Number(dados.envioId);
    const usuarioRecebimentoId = dados.usuarioRecebimentoId
      ? Number(dados.usuarioRecebimentoId)
      : null;

    const observacao = dados.observacao
      ? String(dados.observacao).trim()
      : "Recebimento confirmado pelo sistema.";

    if (!envioId || Number.isNaN(envioId)) {
      enviarJson(res, 400, {
        erro: "O envioId é obrigatório e deve ser um número.",
      });
      return true;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resultadoEnvio = await client.query(
        `
          SELECT
            id,
            loja_id,
            quantidade_enviada,
            status
          FROM envios_taloes
          WHERE id = $1
          FOR UPDATE
        `,
        [envioId],
      );

      if (resultadoEnvio.rows.length === 0) {
        await client.query("ROLLBACK");

        enviarJson(res, 404, {
          erro: "Envio não encontrado.",
        });

        return true;
      }

      const envio = resultadoEnvio.rows[0];

      if (envio.status !== "PENDENTE") {
        await client.query("ROLLBACK");

        enviarJson(res, 409, {
          erro: "Esse envio não está pendente e não pode ser recebido.",
        });

        return true;
      }

      const quantidadeRecebida = Number(
        dados.quantidadeRecebida ?? envio.quantidade_enviada,
      );

      if (Number.isNaN(quantidadeRecebida) || quantidadeRecebida <= 0) {
        await client.query("ROLLBACK");

        enviarJson(res, 400, {
          erro: "A quantidade recebida deve ser maior que zero.",
        });

        return true;
      }

      if (quantidadeRecebida !== Number(envio.quantidade_enviada)) {
        await client.query("ROLLBACK");

        enviarJson(res, 400, {
          erro: "Por enquanto, o recebimento precisa ser total, igual à quantidade enviada.",
        });

        return true;
      }

      const resultadoEstoque = await client.query(
        `
          SELECT
            estoque_atual
          FROM estoques_lojas
          WHERE loja_id = $1
          FOR UPDATE
        `,
        [envio.loja_id],
      );

      if (resultadoEstoque.rows.length === 0) {
        await client.query("ROLLBACK");

        enviarJson(res, 404, {
          erro: "Estoque da loja não encontrado.",
        });

        return true;
      }

      const saldoAnterior = Number(resultadoEstoque.rows[0].estoque_atual);
      const saldoPosterior = saldoAnterior + quantidadeRecebida;

      const resultadoRecebimento = await client.query(
        `
          INSERT INTO recebimentos_taloes (
            envio_id,
            loja_id,
            usuario_recebimento_id,
            quantidade_recebida,
            data_recebimento,
            observacao,
            criado_em
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            NOW(),
            $5,
            NOW()
          )
          RETURNING
            id,
            envio_id,
            loja_id,
            usuario_recebimento_id,
            quantidade_recebida,
            data_recebimento,
            observacao,
            criado_em
        `,
        [
          envio.id,
          envio.loja_id,
          usuarioRecebimentoId,
          quantidadeRecebida,
          observacao,
        ],
      );

      const recebimentoCriado = resultadoRecebimento.rows[0];

      await client.query(
        `
          UPDATE estoques_lojas
          SET
            estoque_atual = $1,
            atualizado_em = NOW()
          WHERE loja_id = $2
        `,
        [saldoPosterior, envio.loja_id],
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
            $3,
            NULL,
            'RECEBIMENTO',
            $4,
            $5,
            $6,
            $7,
            NOW()
          )
        `,
        [
          envio.loja_id,
          usuarioRecebimentoId,
          recebimentoCriado.id,
          quantidadeRecebida,
          saldoAnterior,
          saldoPosterior,
          observacao,
        ],
      );

      await client.query(
        `
          UPDATE envios_taloes
          SET status = 'RECEBIDO'
          WHERE id = $1
        `,
        [envio.id],
      );

      await client.query("COMMIT");

      enviarJson(res, 201, {
        id: recebimentoCriado.id,
        envioId: recebimentoCriado.envio_id,
        lojaId: recebimentoCriado.loja_id,
        quantidadeRecebida: recebimentoCriado.quantidade_recebida,
        dataRecebimento: recebimentoCriado.data_recebimento,
        saldoAnterior,
        saldoPosterior,
        statusEnvio: "RECEBIDO",
        mensagem: "Recebimento confirmado com sucesso.",
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
  tratarRotasRecebimentos,
};
