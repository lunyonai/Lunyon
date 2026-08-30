# Lunyon API (Node + TypeScript)

Backend do Lunyon: auth JWT (Supabase), PostgreSQL, Stripe, PayPal, IA e e-mail.

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

No Supabase → SQL Editor, rode:

`sql/schema.sql`

Isso cria: `profiles`, `purchases`, `prompts`, `templates`, `course_progress`, `settings`.

## Endpoints principais

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | Não | Cadastro |
| POST | `/api/auth/login` | Não | Login (retorna JWT) |
| GET | `/api/auth/me` | Sim | Perfil |
| GET | `/api/prompts` | Sim | Lista prompts |
| POST | `/api/prompts` | Sim | Cria prompt |
| GET | `/api/templates` | Sim | Templates |
| GET/PUT | `/api/course-progress` | Sim | Progresso do curso |
| GET/PUT | `/api/settings` | Sim | Configurações |
| POST | `/api/payments/stripe/checkout` | Sim | Checkout Stripe |
| POST | `/api/payments/stripe/webhook` | Stripe | Webhook |
| POST | `/api/payments/paypal/create-order` | Sim | Ordem PayPal |
| POST | `/api/payments/paypal/capture` | Sim | Captura PayPal |
| POST | `/api/ai/generate` | Sim | Chamada IA |
| POST | `/api/ai/email` | Sim | Envio de e-mail |

Header de auth: `Authorization: Bearer <access_token>`

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
