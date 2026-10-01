# Lunyon

Monorepo com frontend e backend separados.

```
Lunyon/
├── frontend/   → React + Vite (interface)
├── backend/    → Express + TypeScript (API)
└── vercel.json → Config de deploy (Vercel)
```

## Desenvolvimento local

**Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

**Backend:**
```bash
cd backend
pnpm install
pnpm dev
```

O backend precisa das migrações SQL aplicadas no Supabase antes de subir — veja
`backend/README.md`.

## Rotas públicas e idiomas

A landing e o login são traduzidos a partir de `frontend/src/i18n/`:

| Idioma | Landing | Login |
|--------|---------|-------|
| Inglês | `/` | `/login` |
| Português | `/pt` | `/pt/login` |
| Espanhol | `/es` | `/es/login` |

As rotas internas (`/dashboard`, `/employees`, `/prompts`, `/workflows`, `/settings`)
não têm prefixo de idioma. Convenções de marca e i18n estão em `AGENTS.md`.

## Deploy (Vercel)

O `vercel.json` na raiz configura os dois serviços:
- `/` → frontend
- `/api/*` → backend

Configure as variáveis de ambiente no painel do Vercel (veja `frontend/.env.example` e `backend/.env.example`).
