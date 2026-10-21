# Lunyon API (Node + TypeScript)

Backend do Lunyon: auth (Supabase), PostgreSQL, Stripe, IA (OpenAI/Gemini), Google Agenda/Gmail e motor de workflows.

## Stack

- Node.js + Express + TypeScript
- PostgreSQL via Supabase
- JWT (validação do token Supabase)
- Stripe + PayPal
- OpenAI / Anthropic / Gemini
- Nodemailer (SMTP)

## Setup rápido

```bash
cd backend
cp .env.example .env
# preencha as variáveis no .env
npm install
npm run dev
```

API em `http://localhost:3001`  
Health: `GET /health`

## Banco de dados

Aplique as migrações no SQL Editor do Supabase na ordem descrita em [sql/README.md](sql/README.md).

## Testes

```bash
npm test        # node:test + tsx, sem acessar o Supabase
npm run typecheck
```

## Endpoints principais

Header de auth: `Authorization: Bearer <access_token>` (sessão Supabase).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/me`, `/api/entitlement` | Perfil e plano |
| GET/PUT | `/api/settings` | Preferências |
| POST | `/api/ai/prompts/:promptId/run` | Executa um prompt da biblioteca (`followUp`, `notes`, `weekly`) |
| CRUD | `/api/employees` | Funcionários de IA |
| POST | `/api/employees/:id/run` | Executa uma tarefa com o funcionário |
| CRUD | `/api/workflows` | Automações (gatilho `manual` ou `schedule`) |
| POST | `/api/workflows/:id/run` | Inicia uma execução (202; roda em segundo plano) |
| GET | `/api/workflows/:id/runs[/:runId]` | Histórico e progresso das execuções |
| GET | `/api/activity`, `/api/activity/stats?tz=` | Histórico de atividade e estatísticas |
| * | `/api/agent/*` | Assistente (conversas, chave de IA, confirmações) |
| * | `/api/integrations/*` | Google Agenda e Gmail |
| POST | `/api/payments/stripe/checkout` | Checkout Stripe (acesso anual) |
| POST | `/api/payments/stripe/webhook` | Webhook Stripe (libera/remove acesso) |
| GET | `/api/account/export` | Exporta os dados do usuário (LGPD) |
| DELETE | `/api/account` | Exclui a conta (body `{ "confirmEmail": "..." }`) |

### Limites

- IA: cada execução (mensagem do assistente, prompt, tarefa ou etapa de IA de workflow) consome 1 unidade da cota diária. Grátis: `AGENT_FREE_DAILY_LIMIT`; com plano ativo: `AGENT_PAID_DAILY_LIMIT`; com chave própria: 500.
- Rate limit em memória: 300 req/min por sessão/IP na API e 20 req/min por usuário nas rotas que chamam IA.

### Stripe

Configure o webhook no painel do Stripe apontando para `/api/payments/stripe/webhook` com os eventos:
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
Cada compra concluída soma `ENTITLEMENT_DAYS` (padrão 365) ao acesso; um reembolso total remove esses dias.

### Agendador

Com `WORKFLOW_SCHEDULER_ENABLED=true`, a API verifica a cada minuto os workflows agendados e roda a manutenção a cada hora: marca execuções travadas como falhas, expira confirmações pendentes e aplica a retenção de dados (conversas do assistente: 180 dias; execuções: 90; atividade: 365). Em planos que "dormem" por inatividade (ex.: Render free), os agendamentos só rodam com a instância acordada.

## Deploy (Render / Railway)

1. Root directory: `backend`
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Configure as mesmas variáveis do `.env.example`
5. `FRONTEND_URL` = URL do Vercel

## Arquitetura

```
React (Vercel) → API Node (Render/Railway/Azure) → PostgreSQL (Supabase)
                                      ↓
                         Stripe / PayPal / OpenAI / SMTP
```
