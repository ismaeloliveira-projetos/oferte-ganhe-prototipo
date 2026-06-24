const lojasMockadas = [
  {
    codigo: "001",
    nome: "Loja Centro",
    estoqueAtual: 25,
    estoqueMinimo: 30,
    estoqueRecomendado: 100,
  },
  {
    codigo: "002",
    nome: "Loja Zona Norte",
    estoqueAtual: 80,
    estoqueMinimo: 40,
    estoqueRecomendado: 100,
  },
  {
    codigo: "003",
    nome: "Loja Shopping",
    estoqueAtual: 12,
    estoqueMinimo: 25,
    estoqueRecomendado: 90,
  },
  {
    codigo: "004",
    nome: "Loja Gravataí",
    estoqueAtual: 110,
    estoqueMinimo: 40,
    estoqueRecomendado: 100,
  },
  {
    codigo: "005",
    nome: "Loja Canoas",
    estoqueAtual: 45,
    estoqueMinimo: 50,
    estoqueRecomendado: 120,
  },
];

const enviosMockados = [
  {
    id: 1,
    codigoLoja: "001",
    quantidade: 100,
    dataHora: "2026-06-02 09:30",
    responsavel: "Administrador",
    status: "Enviado",
  },
  {
    id: 2,
    codigoLoja: "003",
    quantidade: 80,
    dataHora: "2026-06-01 14:20",
    responsavel: "Administrador",
    status: "Recebido",
  },
  {
    id: 3,
    codigoLoja: "005",
    quantidade: 60,
    dataHora: "2026-06-01 16:45",
    responsavel: "Administrador",
    status: "Pendente",
  },
];

const recebimentosMockados = [
  {
    id: 1,
    idEnvio: 2,
    codigoLoja: "003",
    quantidadeRecebida: 80,
    dataHora: "2026-06-01 17:10",
    responsavel: "Administrador",
    status: "Recebido",
    observacao: "Recebido sem divergência",
  },
  {
    id: 2,
    idEnvio: 3,
    codigoLoja: "005",
    quantidadeRecebida: 50,
    dataHora: "2026-06-02 10:40",
    responsavel: "Administrador",
    status: "Divergente",
    observacao: "Quantidade inferior à esperada, faltam 10 talões",
  },
  {
    id: 3,
    idEnvio: 1,
    codigoLoja: "001",
    quantidadeRecebida: 0,
    dataHora: "-",
    responsavel: "-",
    status: "Pendente",
    observacao: "-",
  },
];

const insightsMockados = [
  "A loja 003 pode atingir o estoque mínimo nos próximos dias.",
  "A loja 005 está abaixo do estoque mínimo e deve receber prioridade de envio.",
  "A loja 004 está com estoque acima do recomendado.",
  "A loja 001 apresenta necessidade de reposição de 75 talões.",
];

const DB_KEY = "oferte_ganhe_db_v1";

function criarBancoInicial() {
  return {
    lojas: lojasMockadas.map(function (loja, index) {
      return {
        id: index + 1,
        codigo: loja.codigo,
        nome: loja.nome,
        estoqueAtual: loja.estoqueAtual,
        estoqueMinimo: loja.estoqueMinimo,
        estoqueRecomendado: loja.estoqueRecomendado,
        conversao: 0.3,
        status: "Ativa",
      };
    }),

    historicoEnvios: historicoEnviosMockado,

    envios: enviosMockados,
    recebimentos: recebimentosMockados,

    usuarios: [
      {
        id: 1,
        nome: "Administrador",
        matricula: "707070",
        email: "admin@empresa.com",
        senha: "123456",
        perfilId: 1,
        lojaId: null,
        permissoes: [
          "dashboard",
          "lojas",
          "usuarios",
          "perfis",
          "estoque",
          "envios",
          "recebimentos",
          "manutencao",
          "relatorios",
          "insights",
        ],
      },
      {
        id: 2,
        nome: "Administrador loja centro",
        matricula: "505050",
        email: "admin@loja.com",
        senha: "123456",
        perfilId: 2,
        lojaId: "001",
        permissoes: [
          "dashboard",
          "lojas",
          "usuarios",
          "estoque",
          "envios",
          "recebimentos",
          "manutencao",
          "relatorios",
          "insights",
        ],
      },
      {
        id: 3,
        nome: "Gestor",
        matricula: "202020",
        email: "gestor@empresa.com",
        senha: "123456",
        perfilId: 3,
        lojaId: "001",
        permissoes: [
          "dashboard",
          "usuarios",
          "estoque",
          "envios",
          "recebimentos",
          "manutencao",
          "relatorios",
          "insights",
        ],
      },
      {
        id: 4,
        nome: "Operador",
        matricula: "101010",
        email: "operador@empresa.com",
        senha: "123456",
        perfilId: 4,
        lojaId: "001",
        permissoes: ["dashboard", "estoque", "envios", "recebimentos"],
      },
    ],

    perfis: [
      {
        id: 1,
        nome: "Administrador",
        nivel: 4,
        permissoes: [
          "dashboard",
          "lojas",
          "usuarios",
          "perfis",
          "estoque",
          "envios",
          "recebimentos",
          "manutencao",
          "relatorios",
          "insights",
        ],
      },
      {
        id: 2,
        nome: "Administrador loja",
        nivel: 3,
        permissoes: [
          "dashboard",
          "lojas",
          "usuarios",
          "estoque",
          "envios",
          "recebimentos",
          "manutencao",
          "relatorios",
          "insights",
        ],
      },
      {
        id: 3,
        nome: "Gestor",
        nivel: 2,
        permissoes: [
          "dashboard",
          "usuarios",
          "estoque",
          "envios",
          "recebimentos",
          "manutencao",
          "relatorios",
          "insights",
        ],
      },
      {
        id: 4,
        nome: "Operador",
        nivel: 1,
        permissoes: ["dashboard", "estoque", "envios", "recebimentos"],
      },
    ],

    insights: insightsMockados,

    sequencias: {
      loja: lojasMockadas.length + 1,
      envio: enviosMockados.length + 1,
      recebimento: recebimentosMockados.length + 1,
      usuario: 5,
      perfil: 5,
    },
  };
}

const historicoEnviosMockado = [
  { mes: "Jan", ano: 2026, totalEnviado: 180 },
  { mes: "Fev", ano: 2026, totalEnviado: 220 },
  { mes: "Mar", ano: 2026, totalEnviado: 195 },
  { mes: "Abr", ano: 2026, totalEnviado: 260 },
  { mes: "Mai", ano: 2026, totalEnviado: 310 },
  { mes: "Jun", ano: 2026, totalEnviado: 240 },
];

function carregarBanco() {
  const bancoSalvo = localStorage.getItem(DB_KEY);

  if (bancoSalvo) {
    const banco = JSON.parse(bancoSalvo);

    if (!banco.historicoEnvios) {
      banco.historicoEnvios = historicoEnviosMockado;
      salvarBanco(banco);
    }

    return banco;
  }

  const bancoInicial = criarBancoInicial();
  salvarBanco(bancoInicial);

  return bancoInicial;
}

function salvarBanco(banco) {
  localStorage.setItem(DB_KEY, JSON.stringify(banco));
}

function resetarBanco() {
  localStorage.removeItem(DB_KEY);
  const bancoInicial = criarBancoInicial();
  salvarBanco(bancoInicial);

  return bancoInicial;
}

function usuarioTemPermissao(usuario, permissaoNecessaria) {
  return usuario.permissoes.includes(permissaoNecessaria);
}

function filtrarPorLoja(dados, usuarioLogado, campo = "codigoLoja") {
  if (!usuarioLogado || !usuarioLogado.lojaId) {
    return dados;
  }
  return dados.filter((item) => item[campo] === usuarioLogado.lojaId);
}

function obterNivelHierarquico(perfilNomeOuId) {
  const banco = carregarBanco();
  const perfilEncontrado = banco.perfis.find(
    (perfil) => perfil.id === perfilNomeOuId || perfil.nome === perfilNomeOuId,
  );
  return perfilEncontrado ? perfilEncontrado.nivel : -1;
}

function podeGerenciar(usuarioLogado, usuarioAlvo) {
  const nivelLogado = obterNivelHierarquico(
    usuarioLogado.perfilId ?? usuarioLogado.perfil,
  );
  const nivelAlvo = obterNivelHierarquico(
    usuarioAlvo.perfilId ?? usuarioAlvo.perfil,
  );

  if (nivelLogado <= nivelAlvo) {
    return false;
  }

  if (!usuarioLogado.lojaId) {
    return true;
  }

  return usuarioLogado.lojaId === usuarioAlvo.lojaId;
}
