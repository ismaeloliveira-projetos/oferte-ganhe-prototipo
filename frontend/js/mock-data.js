const lojasMockadas = [
  {
    codigo: "001",
    nome: "Loja Centro",
    estoqueAtual: 25,
    estoqueMinimo: 30,
    estoqueRecomendado: 100
  },
  {
    codigo: "002",
    nome: "Loja Zona Norte",
    estoqueAtual: 80,
    estoqueMinimo: 40,
    estoqueRecomendado: 100
  },
  {
    codigo: "003",
    nome: "Loja Shopping",
    estoqueAtual: 12,
    estoqueMinimo: 25,
    estoqueRecomendado: 90
  },
  {
    codigo: "004",
    nome: "Loja Gravataí",
    estoqueAtual: 110,
    estoqueMinimo: 40,
    estoqueRecomendado: 100
  },
  {
    codigo: "005",
    nome: "Loja Canoas",
    estoqueAtual: 45,
    estoqueMinimo: 50,
    estoqueRecomendado: 120
  }
];

const enviosMockados = [
  {
    id: 1,
    codigoLoja: "001",
    quantidade: 100,
    dataHora: "2026-06-02 09:30",
    responsavel: "Administrador",
    status: "Enviado"
  },
  {
    id: 2,
    codigoLoja: "003",
    quantidade: 80,
    dataHora: "2026-06-01 14:20",
    responsavel: "Administrador",
    status: "Recebido"
  },
  {
    id: 3,
    codigoLoja: "005",
    quantidade: 60,
    dataHora: "2026-06-01 16:45",
    responsavel: "Administrador",
    status: "Pendente"
  }
];

const recebimentosMockados = [
  {
    id: 1,
    idEnvio: 2,
    codigoLoja: "003",
    quantidadeRecebida: 80,
    dataHora: "2026-06-01 17:10",
    responsavel: "Administrador",
    status: "Recebido"
  },
  {
    id: 2,
    idEnvio: 3,
    codigoLoja: "005",
    quantidadeRecebida: 50,
    dataHora: "2026-06-02 10:40",
    responsavel: "Administrador",
    status: "Divergente"
  },
  {
    id: 3,
    idEnvio: 1,
    codigoLoja: "001",
    quantidadeRecebida: 0,
    dataHora: "-",
    responsavel: "-",
    status: "Pendente"
  }
];

const insightsMockados = [
  "A loja 003 pode atingir o estoque mínimo nos próximos dias.",
  "A loja 005 está abaixo do estoque mínimo e deve receber prioridade de envio.",
  "A loja 004 está com estoque acima do recomendado.",
  "A loja 001 apresenta necessidade de reposição de 75 talões."
];

  const DB_KEY = "oferte_ganhe_db_v1";

  function criarBancoInicial() {
    return {
      lojas: lojasMockadas.map(function(loja, index) {
        return {
          id: index + 1,
          codigo: loja.codigo,
          nome: loja.nome,
          estoqueAtual: loja.estoqueAtual,
          estoqueMinimo: loja.estoqueMinimo,
          estoqueRecomendado: loja.estoqueRecomendado,
          conversao: 0.3,
          status: "Ativa"
        };
      }),

      envios: enviosMockados,

      recebimentos: recebimentosMockados,

      usuarios: [
        {
          id: 1,
          nome: "Administrador",
          matricula: "00001",
          email: "admin@oferteganhe.com",
          senha: "admin123",
          perfilId: 1
        }
      ],

      perfis: [
        {
          id: 1,
          nome: "Administrador",
          permissoes: [
            "dashboard",
            "lojas",
            "usuarios",
            "perfis",
            "envios",
            "estoque",
            "recebimentos",
            "manutencao",
            "relatorios"
          ]
        },
        {
          id: 2,
          nome: "Gestor",
          permissoes: [
            "dashboard",
            "lojas",
            "envios",
            "estoque",
            "recebimentos",
            "relatorios"
          ]
        },
        {
          id: 3,
          nome: "Operador",
          permissoes: [
            "dashboard",
            "envios",
            "recebimentos"
          ]
        }
      ],

      insights: insightsMockados,

      sequencias: {
        loja: lojasMockadas.length + 1,
        envio: enviosMockados.length + 1,
        recebimento: recebimentosMockados.length + 1,
        usuario: 2,
        perfil: 4
      }
    };
  }

  

  function carregarBanco() {
    const bancoSalvo = localStorage.getItem(DB_KEY);

    if (bancoSalvo) {
      return JSON.parse(bancoSalvo);
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

