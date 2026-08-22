# Produkčný deploy — kompletný checklist

Pozri [DEPLOY.md](./DEPLOY.md) pre kroky nasadenia na Vercel + Neon.

## Rýchly prehľad

```bash
npm install
npm run pwa:assets      # ikony + screenshots
cp .env.example .env      # lokálne
npm run db:setup          # Docker DB + migrácia + seed
npm run dev
```

## Produkčné env (Vercel)

| Premenná | Povinné |
|----------|---------|
| `DATABASE_URL` | Áno |
| `CRON_SECRET` | Áno |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Pre push |
| `VAPID_PRIVATE_KEY` | Pre push |
| `VAPID_SUBJECT` | Pre push |

## DB migrácie a seed

```bash
npm run db:migrate        # produkcia (migrate deploy)
npm run db:migrate:dev    # lokálny vývoj
npm run db:seed           # default watches (iPhone 16/17 ČR, MacBook ≥ 20k Kč ČR, Razer ČR, SK)
```

## Produkčné cron úlohy

1. **RSS Polling** (každých 10–15 minút):
   - `GET https://tvoja-domena.vercel.app/api/cron/poll-rss`
   - Header: `Authorization: Bearer CRON_SECRET`
2. **☕ AI Espresso Digest** (2× denne — 08:00 a 20:00):
   - `POST https://tvoja-domena.vercel.app/api/digest/cron`
   - Header: `Authorization: Bearer CRON_SECRET`

## Overenie testov pred deployom

```bash
npm run test:scripts       # 65 unit testov (všetkých 15 kategórií + CZ/SK parser)
npm run test:integration   # Živý multi-source test (Bazoš.sk & Bazoš.cz)
npm run lint               # Linter
npx tsc --noEmit           # TypeScript typová kontrola
```

## Health check

`GET /api/health` — overí pripojenie k databáze.

