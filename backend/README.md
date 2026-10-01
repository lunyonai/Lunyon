# Lunyon API (Node + TypeScript)

Backend do Lunyon: auth via Supabase, PostgreSQL, AI Employees, Workflows, integrações Google e Stripe.

## Stack

- Node.js + Express + TypeScript
- PostgreSQL via Supabase
- JWT (validação do token Supabase)
- Stripe (único meio de pagamento)
- Google Workspace (Gmail + Calendar, via OAuth)
- Nodemailer (SMTP)

## Setup rápido

```bash
cd backend
cp .env.example .env
# preencha as variáveis no .env
pnpm install
pnpm dev
```

API em `http://localhost:3001`
Health: `GET /health`

## Banco de dados

No Supabase → SQL Editor, rode na ordem:

1. `sql/schema.sql` — base: `profiles`, `purchases`, `prompts`, `templates`, `course_progress`, `settings`
2. `sql/20260925_phase1_rls_and_entitlements.sql` — entitlements + políticas RLS
3. `sql/20260925_phase2_ai_employees.sql` — `ai_employees`
4. `sql/20260925_phase2_5_integration_connections.sql` — `integration_connections` (tokens criptografados)
5. `sql/20260925_phase3_workflows.sql` — `workflows`

## Endpoints principais

Header de auth: `Authorization: Bearer <access_token>`

### Identidade

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/auth/me` · `/api/me` | Sim | Perfil normalizado |
| POST | `/api/auth/logout` | Sim | Logout (descarta token no cliente) |
| GET | `/api/entitlement` | Sim | Flags de acesso/assinatura |

Cadastro e login **não** passam pela API — são feitos direto no Supabase Auth pelo
frontend. `POST /api/auth/register` e `POST /api/auth/login` respondem `410`.

### AI Employees

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/employees` | Sim | Lista |
| POST | `/api/employees` | Sim | Cria |
| GET | `/api/employees/:id` | Sim | Detalhe |
| PATCH | `/api/employees/:id` | Sim | Atualiza |
| POST | `/api/employees/:id/duplicate` | Sim | Duplica |
| DELETE | `/api/employees/:id` | Sim | Remove |

### Workflows

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/workflows` | Sim | Lista |
| POST | `/api/workflows` | Sim | Cria |
| GET | `/api/workflows/:id` | Sim | Detalhe |
| PATCH | `/api/workflows/:id` | Sim | Atualiza |
| POST | `/api/workflows/:id/duplicate` | Sim | Duplica |
| DELETE | `/api/workflows/:id` | Sim | Remove |

`POST /api/workflows/:id/run` responde `410` — a execução virá no Workflow Execution Engine.

### Integrações Google

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/integrations/google/connect` | Sim | Retorna `{ url }` do OAuth |
| GET | `/api/integrations/google/callback` | Não | Callback do OAuth |
| GET | `/api/integrations/google/status` | Sim | Status da conexão |
| POST | `/api/integrations/google/disconnect` | Sim | Desconecta |
| GET | `/api/integrations/google/gmail/messages` | Sim | Mensagens recentes |
| GET | `/api/integrations/google/gmail/messages/:id` | Sim | Mensagem |
| GET | `/api/integrations/google/calendar/events` | Sim | Eventos (`range=today\|next7`) |

### Dados e pagamentos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET/POST | `/api/prompts` | Sim | Prompts |
| GET/PUT | `/api/settings` | Sim | Configurações |
| POST | `/api/payments/stripe/checkout` | Sim | Checkout Stripe |
| POST | `/api/payments/stripe/webhook` | Stripe | Webhook |

O preço do checkout vem de `STRIPE_PRICE_ID` no servidor — a API não aceita `priceId`
do cliente, e `successUrl`/`cancelUrl` precisam começar com `FRONTEND_URL`.

PayPal e os endpoints de AI diretos (`/api/ai/generate`, `/api/ai/email`) estão
desativados e respondem `410`.

## Deploy (Render / Railway)

1. Root directory: `backend`
2. Build: `pnpm install && pnpm build`
3. Start: `pnpm start`
4. Configure as mesmas variáveis do `.env.example`
5. `FRONTEND_URL` = URL do Vercel

## Deploy completo (Vercel)

O `vercel.json` na raiz do repositório faz deploy do frontend (`frontend/`) e backend (`backend/`) juntos.

## Arquitetura

```
React (frontend/) → API Node (backend/) → PostgreSQL (Supabase)
                                      ↓
                    Stripe / Google Workspace / SMTP
```
