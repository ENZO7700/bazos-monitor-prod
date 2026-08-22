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
npm run db:seed           # default watches (iPhone, Hodinky)
```

## Externý cron (10 min)

`GET https://tvoja-domena.vercel.app/api/cron/poll-rss`  
Header: `Authorization: Bearer CRON_SECRET`

## Health check

`GET /api/health` — overí pripojenie k databáze.
