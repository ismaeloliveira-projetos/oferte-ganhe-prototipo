const express = require("express");

const iaService = require("../services/ia.service");

const router = express.Router();

router.get("/health", async function (req, res) {
  try {
    const resultado = await iaService.verificarSaudeIa();

    res.status(200).json({
      mensagem: "Serviço de IA acessível pelo Node.",
      dados: resultado,
    });
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao comunicar com o serviço de IA.",
      detalhe: erro.message,
    });
  }
});

router.get("/insights/estoque/risco", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const resultado =
      await iaService.gerarInsightRiscoEstoque(contextoUsuarioIa);

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao gerar insight de risco de estoque.",
      detalhe: erro.message,
    });
  }
});

router.get("/insights/historico", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const limite = Number(req.query.limite) || 20;

    const resultado = await iaService.listarHistoricoInsights(
      contextoUsuarioIa,
      limite,
    );

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao buscar histórico de insights.",
      detalhe: erro.message,
    });
  }
});

router.post("/insights/feedback", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const resultado = await iaService.registrarFeedbackInsight(
      contextoUsuarioIa,
      req.body,
    );

    res.status(201).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao registrar feedback do insight.",
      detalhe: erro.message,
    });
  }
});

router.get("/resumo", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    if (!contextoUsuarioIa.usuario_id) {
      return res.status(400).json({
        mensagem: "Usuário não identificado para consultar resumo da IA.",
      });
    }

    const resultado = await iaService.obterResumoUsoIa(contextoUsuarioIa);

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao buscar resumo de uso da IA.",
      detalhe: erro.message,
    });
  }
});

router.get("/logs", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    if (!contextoUsuarioIa.acesso_global) {
      return res.status(403).json({
        mensagem: "Usuário sem permissão para consultar logs técnicos da IA.",
      });
    }

    const nivel = req.query.nivel || null;
    const origem = req.query.origem || null;
    const limite = Number(req.query.limite) || 50;

    const niveisPermitidos = ["DEBUG", "INFO", "WARN", "ERROR"];

    if (nivel && !niveisPermitidos.includes(nivel)) {
      return res.status(400).json({
        mensagem: "Nível de log inválido.",
        valores_permitidos: niveisPermitidos,
      });
    }

    const resultado = await iaService.listarLogsIa(contextoUsuarioIa, {
      nivel,
      origem,
      limite,
    });

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao consultar logs da IA.",
      detalhe: erro.message,
    });
  }
});

router.get("/indicadores/estoque/risco", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const resultado =
      await iaService.obterIndicadorRiscoEstoque(contextoUsuarioIa);

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao buscar indicador de risco de estoque.",
      detalhe: erro.message,
    });
  }
});

router.post("/chat", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const mensagem = req.body?.mensagem;

    if (!mensagem || typeof mensagem !== "string") {
      return res.status(400).json({
        mensagem: "Campo 'mensagem' é obrigatório.",
      });
    }

    const resultado = await iaService.enviarMensagemChatIa(
      contextoUsuarioIa,
      mensagem,
    );

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao processar mensagem no chat da IA.",
      detalhe: erro.message,
    });
  }
});

router.get("/prompts", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    if (!contextoUsuarioIa.acesso_global) {
      return res.status(403).json({
        mensagem: "Usuário sem permissão para consultar prompts da IA.",
      });
    }

    const nome = req.query.nome || null;
    const limite = Number(req.query.limite) || 50;

    const resultado = await iaService.listarPromptsIa(contextoUsuarioIa, {
      nome,
      limite,
    });

    res.status(200).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao consultar prompts da IA.",
      detalhe: erro.message,
    });
  }
});

router.post("/prompts/versao", async function (req, res) {
  try {
    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    if (!contextoUsuarioIa.acesso_global) {
      return res.status(403).json({
        mensagem: "Usuário sem permissão para criar versão de prompt da IA.",
      });
    }

    const { nome, descricao, conteudo } = req.body || {};

    if (!nome || typeof nome !== "string") {
      return res.status(400).json({
        mensagem: "Campo 'nome' é obrigatório.",
      });
    }

    if (!conteudo || typeof conteudo !== "string") {
      return res.status(400).json({
        mensagem: "Campo 'conteudo' é obrigatório.",
      });
    }

    const resultado = await iaService.criarVersaoPromptIa(contextoUsuarioIa, {
      nome,
      descricao,
      conteudo,
    });

    res.status(201).json(resultado);
  } catch (erro) {
    res.status(502).json({
      mensagem: "Erro ao criar versão de prompt da IA.",
      detalhe: erro.message,
    });
  }
});

router.get("/analises/estoque/previsao", async function (req, res) {
  try {
    const periodoDias =
      req.query.periodo_dias === undefined
        ? 90
        : Number(req.query.periodo_dias);

    if (
      !Number.isInteger(periodoDias) ||
      periodoDias < 30 ||
      periodoDias > 365
    ) {
      return res.status(400).json({
        mensagem: "periodo_dias deve ser um número inteiro entre 30 e 365.",
      });
    }

    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const resultado = await iaService.obterPrevisaoEstoque(
      contextoUsuarioIa,
      periodoDias,
    );

    return res.status(200).json(resultado);
  } catch (erro) {
    return res.status(502).json({
      mensagem: "Erro ao buscar previsão de estoque na IA.",
      detalhe: erro.message,
    });
  }
});

router.get("/analises/envios/anomalias", async function (req, res) {
  try {
    const limiteDias =
      req.query.limite_dias === undefined ? 3 : Number(req.query.limite_dias);

    if (!Number.isInteger(limiteDias) || limiteDias < 1 || limiteDias > 30) {
      return res.status(400).json({
        mensagem: "limite_dias deve ser um número inteiro entre 1 e 30.",
      });
    }

    const contextoUsuarioIa = iaService.montarContextoUsuarioIa(
      req.usuarioContexto,
    );

    const resultado = await iaService.obterAnomaliasEnvios(
      contextoUsuarioIa,
      limiteDias,
    );

    return res.status(200).json(resultado);
  } catch (erro) {
    return res.status(502).json({
      mensagem: "Erro ao buscar anomalias de envios na IA.",
      detalhe: erro.message,
    });
  }
});

module.exports = router;
