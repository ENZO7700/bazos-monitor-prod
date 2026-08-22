# Produkčný deploy checklist

Tento dokument popisuje kroky na nasadenie Bazoš Monitor PWA do produkcie.

## 1. Neon PostgreSQL

**CLI:**

```bash
npx neonctl auth
npx neonctl projects create --name bazos-monitor
npx neonctl connection-string --project-id <id>
```

**Web:** [neon.tech](https://neon.tech) → vytvor projekt → skopíruj connection string s `?sslmode=require`

Lokálne overenie pred deployom:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="..." npm run db:seed
```

## 2. Vercel deploy (CLI)

```bash
vercel link
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add CRON_SECRET production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_SUBJECT production
vercel deploy --prod
```

Build command (`npm run build`) už obsahuje migráciu:

```bash
prisma generate && prisma migrate deploy && next build
```

**Poznámka:** Ak si predtým používal `db push` na existujúcej DB, baseline migráciu:

```bash
npx prisma migrate resolve --applied 20260307200000_init
```

## 3. Povinné env premenné (produkcia)

| Premenná | Popis |
|----------|-------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `CRON_SECRET` | Náhodný reťazec (min. 32 znakov) pre cron a `/api/poll` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Verejný VAPID kľúč pre push |
| `VAPID_PRIVATE_KEY` | Súkromný VAPID kľúč |
| `VAPID_SUBJECT` | `mailto:tvoj@email.sk` |

Vygeneruj secrets:

```bash
openssl rand -base64 32          # CRON_SECRET
npx web-push generate-vapid-keys # VAPID
```

Šablóna: [`.env.production.example`](.env.production.example)

## 4. GitHub Actions cron (každých 10 min) — odporúčané

Workflow: [`.github/workflows/cron-poll.yml`](.github/workflows/cron-poll.yml)

Nastav repo secrets cez CLI:

```bash
gh secret set CRON_SECRET --body "TVOJ_CRON_SECRET"
gh secret set PRODUCTION_URL --body "https://tvoja-app.vercel.app"
gh workflow run cron-poll.yml
```

Vercel Hobby cron (`vercel.json`) zostáva ako záloha 1× denne.

Alternatíva: [cron-job.org](https://cron-job.org) — `GET /api/cron/poll-rss` s `Authorization: Bearer CRON_SECRET`.

Overenie:

```bash
curl -H "Authorization: Bearer TVOJ_CRON_SECRET" \
  https://TVOJA-DOMENA.vercel.app/api/cron/poll-rss
```

## 5. Health check

```bash
curl https://TVOJA-DOMENA.vercel.app/api/health
```

Očakávaná odpoveď: `{"status":"ok","database":"connected"}`

## 6. PWA assets pred deployom

```bash
npm run pwa:assets
git add public/icons public/screenshots
```

## 7. Lighthouse PWA audit

Po HTTPS deployi:

```bash
PRODUCTION_URL=https://tvoja-app.vercel.app npm run pwa:lighthouse
```

Skript používa `--only-categories=pwa` (nie `--only-audits`, ktoré vracia prázdny report).

Alebo Chrome DevTools → Lighthouse → Progressive Web App.

## 8. Agentic Browsing / WebMCP

Experimentálna podpora pre AI agentov (Chrome 150+, Lighthouse kategória `agentic-browsing`).

### Čo je implementované

- [`public/llms.txt`](public/llms.txt) — popis aplikácie a routes pre LLM agentov
- A11y: skip link, `id="main-content"`, `aria-current` na navigácii, labely na formulároch
- **Declarative WebMCP** na `/watches/new` — formulár s `toolname="create_watch"`
- **Imperative WebMCP** — globálne nástroje: `poll_listings`, `list_watches`, `get_stats`, `navigate_listings`
- `Permissions-Policy: tools=(self)` + `Origin-Trial` cez [`src/middleware.ts`](src/middleware.ts) (len pre first-party token)

### Origin trial token (voliteľné)

1. Kompletný setup (odporúčané):

```bash
npm run webmcp:setup
```

Otvorí Chrome Origin Trials, uloží token do `.deploy-secrets` / Vercel, deployne a overí produkciu.

2. Manuálne kroky:
   - Registrácia: [Chrome Origin Trials — WebMCP](https://developer.chrome.com/origintrials#/register_trial/4163014905550602241)
   - **Web origin:** `https://bazos-monitor.vercel.app`
   - **Third party:** **No** (pri `Yes` Chrome hlási chybu `Permissions-Policy: tools`)
   - Token ulož: `npm run webmcp:token -- "TOKEN"` alebo prvý riadok v `tokenchrome.md`
   - Deploy: `npm run vercel:deploy`
   - Overenie: `npm run webmcp:verify`

Token sa posiela ako HTTP hlavičky (`Origin-Trial`, `Permissions-Policy`) cez middleware. Third-party tokeny sa na vlastnej doméne neaktivujú — kód ich zámerne preskočí.

### Lokálny vývoj

- Chrome flag: `chrome://flags/#enable-webmcp-testing`
- Overenie llms.txt: `curl https://bazos-monitor.vercel.app/llms.txt`
- Lighthouse agentic audit (Chrome 150+):

```bash
PRODUCTION_URL=https://bazos-monitor.vercel.app npm run agentic:lighthouse
npm run agentic:score
```

**Poznámka:** Agentic skóre je **fractional pass ratio** (0–1), nie klasické 0–100. Baseline po fáze 1: **0.78**, cieľ **≥ 0.95** (CLS pass na homepage). WebMCP audity môžu v CI zlyhať bez origin trial tokenu — workflow [`.github/workflows/lighthouse-agentic.yml`](.github/workflows/lighthouse-agentic.yml) beží manuálne (`workflow_dispatch`) alebo týždenne a neblokuje deploy (`continue-on-error: true`).

Iterácia po deployi:

```bash
PRODUCTION_URL=https://bazos-monitor.vercel.app npm run agentic:lighthouse
npm run agentic:score
# voliteľne striktný lokálny prah:
AGENTIC_MIN_SCORE=0.95 npm run agentic:score
```

Audit deklaratívneho `create_watch` formulára:

```bash
PRODUCTION_URL=https://bazos-monitor.vercel.app/watches/new npm run agentic:lighthouse
```

## 9. Go-live checklist

- [ ] HTTPS deploy na Vercel
- [ ] `DATABASE_URL` + `CRON_SECRET` nastavené
- [ ] `prisma migrate deploy` úspešné (v build)
- [ ] `npm run db:seed` (default watches)
- [ ] GitHub Actions cron + secrets
- [ ] VAPID keys (ak chceš push)
- [ ] Lighthouse PWA installable
- [ ] Agentic browsing score ≥ 0.95 (CLS pass na homepage)
- [ ] `llms.txt` dostupný na `/llms.txt`
- [ ] `/api/health` vracia OK
- [ ] Manuálny poll z Dashboardu funguje (server action)
- [ ] PWA inštalácia na mobile/desktop

## 10. Bezpečnosť

- `POST /api/poll` vyžaduje `Authorization: Bearer CRON_SECRET` v produkcii
- Manuálne obnovenie z UI používa server action (secret nie je v prehliadači)
- Cron endpoint odmietne požiadavky bez platného secretu v produkcii
