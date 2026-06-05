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
    data: "2026-06-02",
    status: "Enviado"
  },
  {
    id: 2,
    codigoLoja: "003",
    quantidade: 80,
    data: "2026-06-01",
    status: "Recebido"
  },
  {
    id: 3,
    codigoLoja: "005",
    quantidade: 60,
    data: "2026-06-01",
    status: "Pendente"
  }
];

const insightsMockados = [
  "A loja 003 pode atingir o estoque mínimo nos próximos dias.",
  "A loja 005 está abaixo do estoque mínimo e deve receber prioridade de envio.",
  "A loja 004 está com estoque acima do recomendado.",
  "A loja 001 apresenta necessidade de reposição de 75 talões."
];