const express = require("express");
const relatoriosService = require("../services/relatorios.service");

const router = express.Router();

function responderErro(res, erro) {
  const statusCode = erro.statusCode || 500;

  if (statusCode === 500) {
    console.error("Erro interno na rota de relatórios:", erro);
  }

  return res.status(statusCode).json({
    erro: statusCode === 500 ? "Erro interno no servidor." : erro.message,
  });
}

async function enviarCsvRelatorio(req, res, configuracao) {
  const arquivo = await relatoriosService.exportarCsvComPython(
    configuracao.tipoPython,
    configuracao.dados,
  );

  const nomeArquivo = relatoriosService.extrairNomeArquivoDoContentDisposition(
    arquivo.contentDisposition,
    configuracao.nomeArquivoPadrao,
  );

  await relatoriosService.registrarHistoricoExportacao({
    usuarioId: req.usuarioAutenticado?.id,
    tipoExportacao: configuracao.tipoExportacao,
    arquivoGerado: nomeArquivo,
    filtros: configuracao.filtros,
  });

  res.setHeader("Content-Type", arquivo.contentType);
  res.setHeader("Content-Disposition", arquivo.contentDisposition);

  return res.status(200).send(arquivo.buffer);
}

router.get("/", async function (req, res) {
  try {
    return res.status(200).json({
      mensagem: "Módulo de relatórios disponível.",
      rotas: [
        "/api/relatorios/resumo",
        "/api/relatorios/usuarios",
        "/api/relatorios/perfis",
        "/api/relatorios/lojas",
        "/api/relatorios/estoque",
        "/api/relatorios/envios",
        "/api/relatorios/recebimentos",
        "/api/relatorios/manutencoes",
        "/api/relatorios/movimentacoes",
      ],
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/resumo", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarResumoRelatorios(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/usuarios", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioUsuarios();

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/perfis", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioPerfis();

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/lojas", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioLojas(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/estoque", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEstoque(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/estoques", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEstoque(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/envios", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEnvios(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/recebimentos", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioRecebimentos(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/manutencoes", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioManutencoes(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/movimentacoes", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioMovimentacoes(
      req.usuarioContexto,
    );

    return res.status(200).json(relatorio);
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/exportar/estoque-geral", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEstoque(
      req.usuarioContexto,
    );

    return await enviarCsvRelatorio(req, res, {
      tipoPython: "estoque-geral",
      tipoExportacao: "Estoque Geral",
      nomeArquivoPadrao: "relatorio-estoque-geral.csv",
      filtros: {
        descricao: "Todas as lojas",
      },
      dados: relatorio.dados,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/exportar/estoque-critico", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEstoque(
      req.usuarioContexto,
    );

    return await enviarCsvRelatorio(req, res, {
      tipoPython: "estoque-critico",
      tipoExportacao: "Estoque Crítico",
      nomeArquivoPadrao: "relatorio-estoque-critico.csv",
      filtros: {
        descricao: "Lojas com estoque atual menor ou igual ao mínimo",
      },
      dados: relatorio.dados,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/exportar/envios", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioEnvios(
      req.usuarioContexto,
    );

    return await enviarCsvRelatorio(req, res, {
      tipoPython: "envios",
      tipoExportacao: "Envios",
      nomeArquivoPadrao: "relatorio-envios.csv",
      filtros: {
        descricao: "Todos os envios registrados",
      },
      dados: relatorio.dados,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/exportar/recebimentos", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioRecebimentos(
      req.usuarioContexto,
    );

    return await enviarCsvRelatorio(req, res, {
      tipoPython: "recebimentos",
      tipoExportacao: "Recebimentos",
      nomeArquivoPadrao: "relatorio-recebimentos.csv",
      filtros: {
        descricao: "Todos os recebimentos confirmados",
      },
      dados: relatorio.dados,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/exportar/manutencoes", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioManutencoes(
      req.usuarioContexto,
    );

    return await enviarCsvRelatorio(req, res, {
      tipoPython: "manutencoes",
      tipoExportacao: "Manutenções",
      nomeArquivoPadrao: "relatorio-manutencoes.csv",
      filtros: {
        descricao: "Todas as manutenções de estoque",
      },
      dados: relatorio.dados,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/exportar/usuarios", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioUsuarios();

    return await enviarCsvRelatorio(req, res, {
      tipoPython: "usuarios",
      tipoExportacao: "Usuários",
      nomeArquivoPadrao: "relatorio-usuarios.csv",
      filtros: {
        descricao: "Todos os usuários cadastrados",
      },
      dados: relatorio.dados,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

router.get("/exportar/perfis", async function (req, res) {
  try {
    const relatorio = await relatoriosService.gerarRelatorioPerfis();

    return await enviarCsvRelatorio(req, res, {
      tipoPython: "perfis",
      tipoExportacao: "Perfis",
      nomeArquivoPadrao: "relatorio-perfis.csv",
      filtros: {
        descricao: "Todos os perfis de acesso",
      },
      dados: relatorio.dados,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
});

module.exports = router;
