# TalãoFlow

Sistema web de controle e gestão de talões para operações com múltiplas lojas. O projeto reúne o acompanhamento de estoque, envios, recebimentos, manutenções, usuários, perfis de acesso, relatórios e indicadores operacionais em um único painel.

> Este repositório contém um protótipo em evolução do TalãoFlow.



### Tela de login
<img width="1919" height="866" alt="Captura de tela 2026-09-13 180252" src="https://github.com/user-attachments/assets/a2ba86d7-985e-4c99-871d-5391442710fd" />


### Dashboard

<img width="1898" height="867" alt="Captura de tela 2026-09-13 180313" src="https://github.com/user-attachments/assets/b0847996-74c0-4adb-8e5c-e52e4842c0e8" />



### Assistente IA 


<img width="1914" height="858" alt="Captura de tela 2026-09-13 180325" src="https://github.com/user-attachments/assets/006b3151-7763-48f5-b375-93ee79fc60ec" />


### Gestão de talões

<img width="1913" height="875" alt="Captura de tela 2026-09-13 180339" src="https://github.com/user-attachments/assets/48dd43ff-149d-4256-890a-3a960aa36cc0" />


### Relatórios e insights
<img width="1592" height="858" alt="Captura de tela 2026-09-13 180423" src="https://github.com/user-attachments/assets/9a7b6b19-ab7d-462b-8bc5-49987799821a" />


### Mobile 

<img width="354" height="756" alt="Captura de tela 2026-09-13 180514" src="https://github.com/user-attachments/assets/e27987a5-a7f8-43f8-b3f5-09d59e18005b" />



## Funcionalidades

- Autenticação de usuários com JWT.
- Recuperação e redefinição de senha por e-mail.
- Controle de sessão com timeout configurável.
- Dashboard administrativo com indicadores operacionais.
- Cadastro e gerenciamento de lojas.
- Controle de estoque de talões.
- Registro de envios e recebimentos entre lojas.
- Registro de manutenções e movimentações.
- Controle de consumos e saídas de talões.
- Gerenciamento de usuários e perfis de acesso.
- Relatórios operacionais.
- Integração com serviço de IA para análises e insights.
- Interface responsiva para uso em desktop e dispositivos móveis.

## Tecnologias

### Frontend

- HTML5
- CSS3
- JavaScript puro
- Interface responsiva sem framework frontend

### Backend

- Node.js
- Express 5
- PostgreSQL
- JSON Web Token (JWT)
- Nodemailer
- CORS

### Serviço de IA

- Python
- Integração com OpenRouter
- Serviço desacoplado da API principal

## Arquitetura

O projeto está organizado em três partes principais:

```text
frontend/              Interface web estática
backend/src/           API Express principal
backend/ai-service/    Integrações e testes do serviço de IA
```

O backend segue uma separação por responsabilidades:

```text
backend/src/
├── config/             Configurações da aplicação
├── database/           Conexão com o banco de dados
├── middlewares/        Autenticação e contexto do usuário
├── repositories/       Acesso e persistência de dados
├── routes/             Rotas HTTP da API
├── services/           Regras de negócio
├── sql/                Scripts SQL e alterações de schema
└── utils/              Utilitários compartilhados
```

## Pré-requisitos

Antes de iniciar, instale e configure:

- Node.js 20.6 ou superior, necessário para o uso de `node --env-file`.
- npm.
- PostgreSQL.
- Python 3.10 ou superior, caso o serviço de IA seja utilizado.
- Um servidor SMTP, caso o fluxo de recuperação de senha seja utilizado.

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/ismaeloliveira-projetos/oferte-ganhe-prototipo.git
cd oferte-ganhe-prototipo
npm install
```

Crie o arquivo de variáveis de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Preencha o arquivo `.env` com os dados do banco, autenticação, e-mail e demais integrações. Nunca versionar esse arquivo, pois ele pode conter credenciais e chaves privadas.

## Variáveis de ambiente

As principais variáveis esperadas são:

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta da API. O padrão é `3000`. |
| `DB_HOST` | Host do PostgreSQL. |
| `DB_PORT` | Porta do PostgreSQL. |
| `DB_NAME` | Nome do banco de dados. |
| `DB_USER` | Usuário do banco. |
| `DB_PASSWORD` | Senha do banco. |
| `LOJA_SEDE_ID` | Identificador da loja sede. |
| `JWT_SECRET` | Chave usada para assinar os tokens JWT. |
| `JWT_EXPIRES_IN` | Tempo de expiração do token, por exemplo `8h`. |
| `SESSION_TIMEOUT_MINUTES` | Tempo máximo da sessão em minutos. |
| `SESSION_WARNING_MINUTES` | Tempo para exibir o aviso de expiração. |
| `SMTP_HOST` | Host do servidor SMTP. |
| `SMTP_PORT` | Porta do servidor SMTP. |
| `SMTP_SECURE` | Define se o SMTP usa conexão segura (`true` ou `false`). |
| `SMTP_USER` | Usuário do SMTP. |
| `SMTP_PASS` | Senha do SMTP. |
| `SMTP_FROM` | Remetente dos e-mails. |
| `FRONTEND_RESET_PASSWORD_URL` | URL da página de redefinição de senha. |
| `PASSWORD_RESET_TOKEN_MINUTES` | Validade do token de redefinição. |
| `AI_SERVICE_URL` | URL interna do serviço de IA. |
| `AI_SERVICE_INTERNAL_KEY` | Chave interna de comunicação com o serviço de IA. |

> Atenção: o código utiliza `SMTP_SECURE`. Se o arquivo `.env.example` tiver `SMPT_SECURE`, ajuste o nome ao criar o `.env`.

## Banco de dados

Configure o PostgreSQL e execute os scripts SQL presentes em:

```text
backend/src/sql/
backend/ai-service/sql/
```

Os scripts devem ser aplicados conforme a ordem numérica dos arquivos. Eles incluem as estruturas relacionadas a consumos, movimentações e integrações de análise por IA.

## Execução

### API

Inicie o backend com:

```bash
npm start
```

Por padrão, a API ficará disponível em:

```text
http://localhost:3000
```

Verifique se o servidor está ativo acessando:

```text
GET http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "mensagem": "Servidor Express funcionando."
}
```

### Frontend

O frontend é composto por páginas HTML estáticas localizadas em `frontend/pages/`. Para executar corretamente no navegador, utilize um servidor estático, como a extensão Live Server do VS Code ou outra ferramenta equivalente.

Abra a página:

```text
frontend/pages/login.html
```

Confirme no arquivo `frontend/js/api.js` se a URL da API corresponde ao endereço em que o backend está sendo executado.

### Serviço de IA

O diretório `backend/ai-service/` possui o script `teste_llm.py`, usado para validar a comunicação com o OpenRouter. Instale as dependências Python necessárias e configure as variáveis usadas pelo script, incluindo:

```text
OPENROUTER_API_KEY=sua-chave
OPENROUTER_MODEL=openrouter/auto
```

Execute o teste com:

```bash
python backend/ai-service/teste_llm.py
```

## Rotas principais da API

| Prefixo | Recurso | Acesso |
| --- | --- | --- |
| `/api/health` | Verificação de saúde da API | Público |
| `/api/auth` | Login e recuperação de acesso | Público |
| `/api/lojas` | Lojas | JWT |
| `/api/estoques` | Estoques | JWT |
| `/api/envios` | Envios | JWT |
| `/api/recebimentos` | Recebimentos | JWT |
| `/api/manutencoes` | Manutenções | JWT |
| `/api/dashboard` | Indicadores do dashboard | JWT |
| `/api/usuarios` | Usuários | JWT |
| `/api/perfis` | Perfis e permissões | JWT |
| `/api/relatorios` | Relatórios | JWT |
| `/api/ia` | Recursos de inteligência artificial | JWT |
| `/api/consumos` | Consumos de talões | JWT |

Todas as rotas, exceto `/api/health` e as rotas de autenticação, exigem um token JWT válido.

## Estrutura do frontend

```text
frontend/
├── css/main.css
├── js/
│   ├── api.js
│   ├── auth.js
│   ├── dashboard.js
│   └── ...
└── pages/
    ├── login.html
    ├── dashboard.html
    ├── estoque.html
    ├── envios.html
    ├── recebimentos.html
    ├── lojas.html
    ├── usuarios.html
    ├── perfis.html
    └── relatorios.html
```

## Testes

O script de teste configurado no `package.json` ainda é um placeholder. Para validar manualmente a API, utilize o endpoint `/api/health`, faça login e teste as rotas protegidas com o token retornado.

## Próximos passos

- Adicionar testes automatizados para API e regras de negócio.
- Documentar os contratos completos dos endpoints.
- Criar migrations automatizadas para o banco de dados.
- Finalizar a integração entre o serviço de IA e o ambiente de produção.
- Adicionar imagens reais e um ambiente de demonstração.

## Contribuição

1. Crie uma branch para sua alteração.
2. Faça as mudanças necessárias.
3. Valide a aplicação localmente.
4. Abra um pull request descrevendo o que foi alterado.

## Licença

Este projeto está atualmente configurado com a licença `ISC`, conforme definido no `package.json`.
