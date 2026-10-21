# Lunyon

Plataforma Lunyon — frontend React + backend Node/TypeScript + PostgreSQL (Supabase).

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

Depois aplique as migrações do banco na ordem de [backend/sql/README.md](backend/sql/README.md).

## Testes e CI

```bash
npm run build            # frontend: typecheck + build
cd backend && npm test   # backend: testes unitários
```

O GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) roda build do frontend e typecheck, testes e build do backend em cada push e PR.

Detalhes da API: [backend/README.md](backend/README.md)
