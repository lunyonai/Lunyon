# Lunyo

Plataforma Lunyo — frontend React + backend Node/TypeScript + PostgreSQL (Supabase).

## Estrutura

```
frontend/
├── src/                 # Frontend React (Vercel)
├── backend/             # API Node/TS (Render / Railway / Azure)
│   ├── src/
│   ├── sql/schema.sql
│   └── README.md
├── package.json         # Frontend
└── .env.example
```

## Arquitetura

```
React (Vercel)
    ↓
API Node/TS (Render / Railway / Azure)
    ↓
PostgreSQL + Auth (Supabase)
    + Stripe / PayPal / OpenAI / Anthropic / Gemini / SMTP
```

## Frontend

```bash
cp .env.example .env
npm install
npm run dev
```

## Backend

```bash
cd backend
cp .env.example .env
# preencha SUPABASE_* e demais chaves
npm install
npm run dev
```

Depois rode `backend/sql/schema.sql` no SQL Editor do Supabase.

Detalhes da API: [backend/README.md](backend/README.md)
