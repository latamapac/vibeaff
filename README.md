# VibeAff Monorepo

## Architecture

| App | URL | Description |
|-----|-----|-------------|
| `apps/landing` | vibeaff.com | Marketing landing page |
| `apps/app` | app.vibeaff.com | Main app (backoffice, toolkits, login) |
| `apps/docs` | docs.vibeaff.com | Developer portal (Matrix + normal mode) |
| `apps/api` | api.vibeaff.com | Express API (35+ endpoints) |
| `packages/sdk` | npm | One-command integration SDK |

## Quick Start

```bash
npm install
```

### API
```bash
cp apps/api/.env.example apps/api/.env
# Edit .env with your Neon DATABASE_URL
npx --workspace apps/api prisma migrate dev --name init
npm run db:seed --workspace apps/api
npm run dev:api
```

### Landing
```bash
npm run dev:landing
```

### App (backoffice)
```bash
cp apps/app/.env.example apps/app/.env.local
npm run dev:app
```

### Docs (developer portal)
```bash
cp apps/docs/.env.example apps/docs/.env.local
npm run dev:docs
```

## Deploy (Vercel preview)

```bash
npx vercel --cwd apps/api && npx vercel --cwd apps/landing && npx vercel --cwd apps/app && npx vercel --cwd apps/docs
```
