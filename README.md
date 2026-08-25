# Bazoš Monitor PWA

Legitímna PWA aplikácia na sledovanie nových inzerátov na [Bazoš.sk](https://www.bazos.sk) a [Bazoš.cz](https://www.bazos.cz) cez verejné RSS feedy.

## Funkcie

- **Multi-country vyhľadávanie**: Sledovanie inzerátov na **🇸🇰 Bazoš.sk** aj **🇨🇿 Bazoš.cz** s možnosťou nezávislého zapnutia/vypnutia pre každé sledovanie
- **☕ AI Espresso Digest**: Ranné (08:00) a večerné (20:00) AI vyhodnocovanie a výber **TOP 3 najlepších úlovkov dňa** (Praha & ČR) pre iPhone 16/17, MacBook ≥ 20k Kč a Razer
- **AI Klasifikácia & Intent Parser**: Inteligentný Mistral prompt pre všetkých 15 kategórií Bazošu bez zbytočných predvolených filtrov
- Sledovanie inzerátov podľa kategórie (RSS)
- Filtrovanie podľa kľúčových slov, cenového rozpätia (€ a Kč) a krajiny
- Dashboard so štatistikami
- Browser / PWA push notifikácie (s vlajkou krajiny 🇸🇰/🇨🇿)
- Manuálne a automatické obnovovanie (cron)
- Odkazy na oficiálny Bazoš inzerát
- **Watchlist telefónnych čísel** — sledovanie podozrivých čísel (SK +421 aj CZ +420) zverejnených vo verejných inzerátoch

### Telefóny / watchlist čísel

Stránka **Telefóny** (`/phones`):

1. Pridáš číslo (napr. `0901 234 567` alebo `+421…`) + voliteľný label.
2. Pri polle RSS sa z **verejného** detailu inzerátu stiahne HTML (rovnaký GET ako lokalita) a extrahujú sa telefóny.
3. Ak sa číslo zhoduje s watchlistom → záznam match + voliteľná push notifikácia.
4. Manuálne vyhľadávanie prehľadá už stiahnuté inzeráty; „Hľadať + dohľadať“ doplní telefóny z verejných detailov (max 15 / request, rate-limit).

**Čo to robí:** len verejné RSS + verejná URL inzerátu, User-Agent `BazosMonitor/…`, cache `phonesFetchedAt` (neopakuje fetch).

**Čo to nerobí:** žiadny login na bazos.sk, žiadne `moje-inzeraty.php`, žiadny prístup k privátnym dátam predajcu — len to, čo je zverejnené na stránke inzerátu.

## Tech stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS v4, shadcn/ui
- Prisma + PostgreSQL (Neon)
- TanStack Query, Serwist PWA, web-push

## Environment variables

Copy `.env.example` to `.env` for local development (`npm run env:bootstrap` can automate this).

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CRON_SECRET` | Yes (prod) | Bearer token for cron/poll endpoints |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Web push — public VAPID key |
| `VAPID_PRIVATE_KEY` | No | Web push — private VAPID key |
| `VAPID_SUBJECT` | No | Web push — contact URI (e.g. `mailto:…`) |
| `MISTRAL_API_KEY` | No | AI digest/classification (has offline fallback) |
| `NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN` | No | Chrome WebMCP origin trial token |

For Vercel production, see also `.env.production.example`. Never commit `.env`, `.env.local`, or secret values.

## Health checks

- `GET /api/health` — readiness probe (includes DB connectivity)
- `GET /api/ready` — alias of `/api/health`

## Lokálny vývoj

### 1. Závislosti

```bash
npm install
npm run pwa:assets
```

### 2. Databáza (OrbStack — odporúčané)

Najrýchlejšia cesta pre lokálne testovanie. Vyžaduje [OrbStack](https://orbstack.dev) alebo Docker.

```bash
cp .env.example .env
npm run db:setup
```

Tým sa spustí PostgreSQL 16 v Dockeri na porte **5433** (vyhýba sa konfliktu s lokálnym Postgres na 5432) a aplikuje sa Prisma schéma.

| Príkaz | Popis |
|--------|-------|
| `npm run db:up` | Spustí Postgres kontajner |
| `npm run db:down` | Zastaví kontajner |
| `npm run db:setup` | Spustí DB + `prisma db push` |
| `npm run db:studio` | Prisma GUI |

### 2b. Databáza (Neon — alternatíva / produkcia)

1. Vytvor free PostgreSQL na [neon.tech](https://neon.tech)
2. Nastav `DATABASE_URL` a `CRON_SECRET` v `.env` (viď tabuľku vyššie)

```bash
npm run db:push
```

Alebo s migráciami (odporúčané):

```bash
npm run db:migrate
npm run db:seed
```

### 3. VAPID kľúče (voliteľné, pre push notifikácie)

```bash
npx web-push generate-vapid-keys
```

Pridaj `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` a `VAPID_SUBJECT` do `.env`.

### 4. Spustenie

```bash
npm run dev
```

Otvor [http://localhost:3000](http://localhost:3000)

### 5. Testovanie PWA (offline, push, inštalácia)

Service worker je vypnutý v `dev` móde. Pre plnú PWA funkcionalitu:

```bash
npm run pwa:dev
```

Otvor [http://localhost:3000](http://localhost:3000) v Chrome/Edge. Otestuj inštaláciu, offline režim a push notifikácie.

## E2E testy (Playwright)

Vyžaduje bežiacu PostgreSQL (`npm run db:up` alebo `npm run db:setup`).

```bash
npm run test:e2e        # spustí dev server na porte 3099 + testy
npm run test:e2e:ui     # interaktívny režim
```

Testuje: API (health, ready, CRUD, auth), navigáciu, dashboard, watches, listings, settings — desktop aj mobile viewport.

## Deploy na Vercel

Kompletný checklist: **[DEPLOY.md](./DEPLOY.md)**

1. Pushni repozitár na GitHub
2. Importuj projekt vo Vercel
3. Nastav env premenné (`DATABASE_URL`, `CRON_SECRET`, VAPID keys)
4. Build: `prisma generate && prisma migrate deploy && next build`
5. Po deployi: `npm run db:seed` (ak ešte nemáš default watches)
6. Nastav externý cron každých 10 min (viď nižšie)
7. Over Lighthouse PWA audit na HTTPS URL

### Automatické obnovovanie

| Metóda | Interval | Poznámka |
|--------|----------|----------|
| Vercel Cron (Hobby) | 1× denne | Nastavené v `vercel.json` |
| Externý cron | každých 10 min | Odporúčané pre aktívne sledovanie |
| Manuálne | kedykoľvek | Tlačidlo „Obnoviť teraz“ na Dashboarde |

#### Externý cron (cron-job.org)

- URL: `https://tvoja-domena.vercel.app/api/cron/poll-rss`
- Metóda: GET
- Header: `Authorization: Bearer TVOJ_CRON_SECRET`
- Interval: každých 10 minút

## RSS limity Bazošu

- Max ~50 RSS požiadaviek na cyklus
- Odporúčaný interval medzi pollmi: 10+ minút
- Filtre kľúčových slov sa aplikujú po stiahnutí RSS (vyhľadávanie v RSS URL nefunguje)

## Kategórie (rub kódy)

| Kód | Kategória |
|-----|-----------|
| au | Auto |
| mo | Mobily |
| pc | PC |
| re | Reality |
| ... | viď `src/lib/categories.ts` |

## Štruktúra

```
src/
├── app/           # Stránky a API routes
├── components/    # UI komponenty
├── hooks/         # React hooks
└── lib/           # RSS parser, DB, push, poll service
```

## Licencia

Osobné použitie. Rešpektuj podmienky služby Bazoš.sk.
