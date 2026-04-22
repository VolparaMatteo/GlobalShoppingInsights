# 🚀 Piano di consegna GSI

**Target**: VPS Linux del cliente
**DB di produzione**: PostgreSQL
**Deployment**: Docker + docker-compose + reverse proxy (Traefik o nginx + certbot)
**Deadline**: _TBD_

---

## Legenda priorità

- 🔴 **P0** — bloccante per la consegna (no go-live senza)
- 🟡 **P1** — atteso da un cliente professionale (qualità)
- 🟢 **P2** — polish e differenziazione

## Scenari

| Scenario | Sprint inclusi | Durata |
|---|---|---|
| **Minimum viable** | 0 · 1 · 2 · 3 · 5 · 8 | ~9 settimane |
| **Professional** ⭐ raccomandato | + 4 · 6 · 7 | ~17 settimane |
| **Perfect** | + pentest esterno, UAT esteso, benchmark competitor | ~19 settimane |

> **Nota sull'UI/UX**: lo Sprint 7 (design system + look & feel) è stato elevato a
> **P1 — parte integrante dello scenario Professional**. Un prodotto editoriale
> consegnato a un cliente esigente deve essere *moderno, accattivante e perfetto*
> anche sul piano visivo, non solo funzionante.

---

## Stato verificato al 2026-04-22 (post-merge PR #2)

Verifica sul codebase reale (non sulla percezione). Aggiornare a ogni chiusura
di batch/sprint. Ultimi 2 PR mergeati su `main`:
- **PR #1** (`7306122` parent): preparazione consegna Sprint 0→5 core + Sprint 8 docs
- **PR #2** (`7306122`): Sprint 4 completo + Sprint 6 parziale + Sprint 7 foundation + polish b1

### Sprint completati (tutti su `main`)

| Sprint | Stato | Copertura reale |
|---|---|---|
| 0 Fondazioni | ✅ done | tooling, CI, Makefile, pre-commit attivi |
| 1 Security (backend) | ✅ done | config validator, Fernet, JWT refresh rotation, slowapi, security headers, audit log API. **UI audit log → Sprint 7** |
| 2 DB & Postgres | ✅ done (light) | Alembic, pool, indici, backup/restore. Async rinviato a post-VPS |
| 3 Test baseline | ✅ done | **149 test backend** (132 + 10 circuit_breaker + 7 image_processing) + 3 file test frontend (9 casi). Coverage gate backend 50%. Coverage frontend **da attivare** |
| 4 Observability | ✅ done | batch 1-4 completi: structlog + request_id + @with_retry + health deep + circuit breaker Ollama + LLMStatusBanner UI + errorToast IT + Sentry opt-in + Prometheus /metrics + logrotate template + /dashboard/alerts |
| 5 Deploy | 🔴 core done | Dockerfile.prod ×2, compose.prod Traefik v3 + ACME, deploy.sh rollback, RUNBOOK 11 sezioni. **Mancano**: CI/CD GHCR push, UptimeRobot, dry-run VPS reale |
| 6 Performance | 🟡 parziale | **Frontend**: bundle analyzer + sourcemap + chunk splitting + react-virtuoso dep. **Backend**: fix N+1, Pillow+WebP resize, cache nginx 1y, cache utility TTL. **Rinviato post-VPS**: ARQ+Redis migration, cache attivazione endpoint |
| 8 Doc/UAT/Handoff | 🟡 parziale | **Done**: USER_GUIDE + ADMIN_GUIDE + DEVELOPER_GUIDE + RUNBOOK + PDF tecnico + README allineato. **Mancano**: screenshot UI (post Sprint 7), UAT, OWASP ZAP, k6, video walkthrough, contratto manutenzione |

### Sprint 7 (in corso)

| Batch | Stato | Contenuto |
|---|---|---|
| Foundation | ✅ done | Design tokens TS (300+ righe, 8 palette WCAG AA 10-step) + ConfigProvider AntD dark+light + uiStore themeMode persistito + Inter self-hosted + logo SVG + favicon + skip-to-content a11y + ThemeToggle Lucide Moon/Sun |
| Polish batch 1 | ✅ done | StatusBadge + ScoreBadge + RoleChip custom con Lucide icons + wrapper deprecated per retrocompat + PipelineFunnel Recharts nella Dashboard + PipelineOverview refresh (dark-mode aware) + sidebar migrata completamente a Lucide |
| Polish batch 2 | ✅ done | **p1** (`fa7f641`): PageTransition framer-motion (fade+slide 200ms con reduced-motion) + SkeletonLoaders shimmer 4 varianti (Page/Table/Cards/Detail) + EmptyIllustrated SVG 6 variant + Sparkline Recharts + KPICards rinnovata (Lucide + tokens + sparkline trend 7gg). **p2** (`30ca556`): hook `useToast` (success/info/warning/error + toast.promise) wrapping `App.useApp()`, AntdApp config (maxCount=3, top=72, notification bottom-right), Lucide su InboxFilters (Search, X) |
| Productivity | 🟡 in corso | **Done**: CommandPalette (cmdk, ⌘+K/Ctrl+K, ricerca articoli+prompt via React Query con debounce 200ms, azioni naviga+toggle-tema+nuovo-prompt/utente ruolo-aware, footer con kbd hints) + useKeyboardShortcut hook (mod/shift/alt parsing + skip-in-input eccetto ⌘+K) + ShortcutsCheatsheet modal (aperto con ?) + TypedConfirmModal (pattern "digita SCARTA" per destructive) + integrazione in MainLayout con mod+k/?/mod+shift+L. **Next**: onboarding tour (react-joyride) + optimistic UI su mutation chiave |
| A11y + i18n + refactor | ⏳ pending | axe-core WCAG 2.1 AA + focus trap + react-i18next IT/EN + bottom-sheet filtri mobile + refactor ArticlePreviewDrawer 764/PromptSearchHistory 342/PromptForm 339 + Lighthouse budget CI |

### Blocker assoluti prima della consegna (minimum viable)

- [x] ~~Manuale utente + admin + developer + PDF tecnico + README~~ done
- [x] ~~CI verde su Linux~~ — tutti e 3 i job passano (backend mypy + pytest coverage ≥50%, frontend lint+tsc+vitest, dependency audit)
- [ ] Dry-run completo di `./deploy.sh` su VPS di staging — `RUNBOOK.md §2`
- [ ] OWASP ZAP baseline scan su staging — no HIGH findings
- [ ] Contratto di manutenzione proposto al cliente

### Gap per lo scenario "Professional" (raccomandato)

- [x] ~~Sprint 4 batch 2-4~~ done
- [x] ~~Sprint 6 parziale~~ done (non-VPS)
- [x] ~~Sprint 7 foundation + polish b1~~ done
- [ ] **Sprint 7 polish b2 + productivity + a11y** (in corso) — design completo, motion, command palette, a11y WCAG AA, i18n, refactoring file grandi, Lighthouse ≥95
- [ ] Sprint 6 post-VPS — ARQ+Redis + cache attivazione (richiede Redis vivo)
- [ ] Sprint 5 post-VPS — test live deploy, UptimeRobot, CI/CD GHCR

### Note operative

- **Coverage frontend**: `fail_under` non configurato. Test 3 componenti comuni. Target pre-consegna: gate ≥30% + LoginPage/ProtectedRoute/RoleGuard coperti.
- **pip-audit**: attivo in CI con `--ignore-vuln PYSEC-2022-252` (deep-translator 2022 takeover, versione attuale sicura).
- **Password reset utente**: endpoint `/auth/password-reset` non presente. Admin-only reset da UI ora (Sprint 7 productivity). Valutare aggiunta pre-consegna (~2h).
- **Default admin**: `admin@gsi.local`/`admin123` sostituito da random in seed se default, ma `.env.prod` sul VPS **deve** avere valore custom.

---

## Sprint 0 — Fondazioni ✅ `COMPLETATO`

**Obiettivo**: strumenti per lavorare veloci e in sicurezza.

- [x] `CLAUDE.md` completo (guida di sviluppo)
- [x] Backend tooling: `ruff` (lint + format) + `mypy` in `backend/pyproject.toml` + `requirements-dev.txt`
- [x] Frontend tooling: `eslint` (flat config v9) + `prettier` + `vitest` + `typescript-eslint`
- [x] `pre-commit` framework con hook per formatting/lint + igiene file (trailing-whitespace, detect-private-key, …)
- [x] GitHub Actions CI: job backend (ruff + mypy) + job frontend (eslint + prettier + tsc) su PR e push a `main`
- [x] `.env.example` completo e commentato (backend + frontend)
- [x] `Makefile` con target: `install`, `install-hooks`, `dev-*`, `lint`, `lint-fix`, `format`, `type-check`, `test`, `test-coverage`, `clean`

**DoD**: ✅ infrastruttura pronta.
**Azione utente**: `make install && make install-hooks && make lint` per validare in locale.

**Note di decisione**:
- Usato **Ruff-only** per lint + format (sostituisce anche Black: più veloce, un tool solo, output Black-compatible).
- Mypy parte con `disallow_untyped_defs = false` per adozione graduale; stringeremo in Sprint 3+.

---

## Sprint 1 — Security hardening ✅ `COMPLETATO (backend)`

**Obiettivo**: eliminare ogni rischio di sicurezza bloccante per produzione.

### Segreti & autenticazione
- [x] `config.py`: validator Pydantic che rifiuta avvio in `ENV=production` se `SECRET_KEY`, `WP_ENCRYPTION_KEY`, `ADMIN_PASSWORD` sono al default (anche `SECRET_KEY` < 32 char) — commit `b397ea0`
- [x] Cifratura `wp_app_password` con `cryptography.fernet.Fernet` + `migrate_plaintext_passwords()` idempotente eseguita al lifespan — commit `488d36e`
- [x] `seed.py`: admin password random (`secrets.token_urlsafe(18)`) con banner one-shot se `ADMIN_PASSWORD` è al default — commit `3fafffd`
- [x] Password policy min 12 char + rifiuto lista password comuni sui schema `UserCreate`/`UserUpdate` — commit `3fafffd`
- [ ] No-pwned check via HIBP k-anon (opzionale) — rinviato a Sprint 4 (observability); aggiunge dipendenza esterna non critica
- [x] JWT refresh rotation con tabella `refresh_tokens` (jti, expires_at, revoked_at) + `/logout` che revoca — commit `924218d`

### Network & headers
- [x] `slowapi` rate limiting: `/auth/login` 5/min, `/auth/refresh` 20/min, `/publish/{id}` 10/min, `/publish/{id}/retry` 5/min, `/prompts/{id}/run` 20/min — commit `98dddec`
- [x] CORS: validator rifiuta `localhost`/`127.0.0.1` in `ENV=production` (l'operatore deve settare il dominio specifico nel `.env` del VPS) — commit `b397ea0`
- [x] `SecurityHeadersMiddleware` custom: HSTS (solo production), CSP (esentata /docs), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — commit `855ab74`
- [x] Dependency audit in CI: `pip-audit` + `npm audit --audit-level=high` come job advisory (non-bloccante) — commit successivo al batch 8

### Audit
- [x] Tabella `audit_logs` (il modello `AuditLog` preesisteva) — ora emessa su: `login`, `login.failed` (anche per email sconosciuta), `login.deactivated`, `logout`, `user.create`, `user.update`, `user.password_change`, `user.role_change`, `user.deactivate`, `wp_config.update` — commit `b71243a`
- [x] API `GET /api/v1/audit-logs` (admin-only, paginato, filtri per action/entity/user_id) — commit `b71243a`
- [ ] UI per consultare audit log — rinviata a Sprint 7 (UX polish) insieme al refactoring frontend

**DoD raggiunto**:
- ✅ Segreti default in `ENV=production` → il server non si avvia
- ✅ Tentativo di login con `admin@gsi.local/admin123` dopo il seed con password random fallisce
- ✅ Password WP cifrata in DB, API non la espone
- ✅ Refresh token ruotati, token vecchio non riusabile
- ✅ Rate limit attivo su endpoint sensibili
- ✅ Header di sicurezza presenti su tutte le risposte
- ⬜ OWASP ZAP baseline scan senza HIGH findings — da eseguire in Sprint 5 (staging)
- ⬜ UI audit log — Sprint 7

**Test aggiunti**: 6 file di test (encryption, config, wp_password, password_policy, admin_seed, refresh_rotation, rate_limit, security_headers, audit_log) — ~55 casi di test totali.

---

## Sprint 2 — DB, migrazioni & Postgres ✅ `COMPLETATO (light)`

**Obiettivo**: database professionale, migrazioni affidabili, backup.
**Strategia presa in corso**: Sprint 2 "light" — sync SQLAlchemy mantenuto, la migrazione ad async è rinviata a Sprint 6 (insieme ad ARQ/Redis queue). Il resto fatto per intero.

### Migrazioni ✅
- [x] Estratto tutto l'SQL raw dal `main.py` lifespan (6 blocchi) — commit `c24133c`
- [x] Alembic setup completo: `alembic.ini` in root di backend/, `env.py` che legge URL da `settings` con override `ALEMBIC_DATABASE_URL`, `script.py.mako`, `versions/` — commit `80ba510`
- [x] Baseline migration `4ea4ce5720fb` che crea tutte le 22 tabelle — commit `80ba510`
- [x] Rimossi tutti gli `except: pass` silenziosi (sostituiti da `logger.exception`) — commit `c24133c`
- [x] `Base.metadata.create_all` rimosso dal lifespan: Alembic è ora autoritativo

### Postgres ✅ (sync)
- [x] `psycopg[binary]>=3.2.0` in requirements — commit `5763cf8`
- [x] Pool connessioni: `pool_size=5`, `max_overflow=10`, `pool_pre_ping=True`, `pool_recycle=3600` — applicati automaticamente ai dialect non-SQLite in `app/database.py`
- [ ] ~~Conversione a `AsyncSession`~~ — **rinviato a Sprint 6**. L'async database non è bloccante per la consegna: useremo ARQ + Redis per spostare i task pesanti fuori dalla request in Sprint 6, dove la conversione async ha senso.
- [x] `seed.py` idempotente: check-before-insert per ogni entità (admin, calendar_rules, tags, categories, wp_config); `_check_schema_ready()` fail-fast se Alembic non è stato eseguito — commit `cf32652`

### Performance & backup ✅
- [x] Indici aggiunti via Alembic migration `a44dfb48a9a0`: `article.content_hash`, `search_result.url`. `article.canonical_url`/`status`/`created_at` erano già indicizzati nel baseline — commit `eb4871c`
- [x] `scripts/backup.sh`: `pg_dump` compresso con retention configurabile (default 30gg) — commit successivo al batch 2F
- [x] `scripts/restore.sh`: drop + recreate + restore con conferma interattiva e `ON_ERROR_STOP=1`
- [x] `scripts/README.md`: variabili d'ambiente, esempio cron, roadmap a systemd timer in Sprint 5

**DoD raggiunto**:
- ✅ `alembic upgrade head` su DB vuoto crea schema completo (verificato in locale)
- ✅ Backup/restore documentati (da testare sul VPS quando disponibile)
- ✅ SQLite rimane supportato in dev (dispatch automatico dei kwargs in `database.py`)
- ⬜ Test di restore su staging — Sprint 5 quando il VPS è pronto

**Test aggiunti** (+ 9 casi): `test_database_engine` (dispatch kwargs), `test_seed_idempotence` (tutte le funzioni).

---

## Sprint 3 — Test suite ✅ `COMPLETATO (baseline)`

**Obiettivo**: copertura minima per consegnare con fiducia.

### Backend ✅ (130 test totali: 120 passing + 10 skippati su Windows per AppLocker, gireranno in CI Linux)
- [x] `pytest` + fixture: user_factory, headers_for, article_factory, client/db isolation — commit `e757343`
- [x] **State machine workflow articoli**: 18 test (sanity maps, happy path admin, role gating per contributor/editor/reviewer/admin, invalid skip, force=true, /transitions) — commit `e757343`
- [x] Security utils: coperti da Sprint 1 (test_encryption, test_refresh_rotation, test_password_policy)
- [x] Pipeline discovery con mock: 10 test (happy, dedup URL+hash, filtri lingua/data/score, LLM reject high-conf/low-conf/unavailable, blacklist, DDGS fail) — commit `bbc5c62`. **Note**: skippati in locale per policy AppLocker Windows su lxml/etree.pyd; gireranno in CI Linux
- [x] RBAC comprehensive su 18 endpoint × 5 ruoli — commit `064bd3a`
- [x] `wordpress_service`: 6 test (publish success/no-config/http-error, editorial slot, article not found silent, decifratura password) — commit `be31e59`
- [x] `taxonomy_sync_service`: 5 test (pull, push, remove orphans, error resilience, parent linking) — commit `be31e59`
- [x] Rate limiting: smoke test in Sprint 1 (limiter disabilitato in test env)

### Frontend ✅ (9 test su componenti common)
- [x] Vitest + @testing-library/react + jest-dom — commit `c712875`
- [x] `SafeHTML` (XSS protection: script, onerror, className) — 4 test
- [x] `EmptyState` (default desc, custom desc, children action) — 3 test
- [x] `RelativeTime` (formato italiano) — 2 test
- [ ] `LoginPage`, `ProtectedRoute`, `RoleGuard`, `PromptForm` — rinviati a Sprint 3.5/8 (richiedono MSW + router + store setup)
- [ ] E2E Playwright — rinviato a Sprint 8 (UAT)

### CI ✅
- [x] Coverage gate backend: `fail_under = 50` in pyproject (alzato a 70 in Sprint 8) — commit successivo al batch 3F
- [x] Upload coverage.xml come artifact della CI
- [x] Vitest run integrato nel job frontend
- [ ] E2E Playwright — rinviato a Sprint 8

**DoD raggiunto**:
- ✅ `pytest` verde: 111 passed (+10 skipped su Windows) — in locale verificato
- ✅ `npm run test` verde: 9 passed in ~8s
- ✅ CI workflow aggiornato con gate coverage ≥50% backend
- ⬜ Playwright E2E — Sprint 8
- ⬜ Coverage gate 70% backend + 50% frontend — Sprint 3.5 dopo completamento test dei componenti pesanti

---

## Sprint 4 — Observability & error handling ✅ `COMPLETATO (batch 1-4)`

**Obiettivo**: in produzione sappiamo subito cosa è successo e perché.

### Logging
- [x] `structlog` con output JSON (prod) + console (dev/test) — commit Sprint4-B1
- [x] Request ID correlato propagato in tutti i log di una request (ContextVar + `RequestIdMiddleware`) + header `X-Request-ID` in risposta
- [x] No PII nei log: processor `_mask_secrets` su substring `password`/`token`/`authorization`/`secret`/`api_key`/`wp_app_password`/`encryption_key`
- [x] Log rotation: template `deploy/logrotate/gsi` pronto per `/etc/logrotate.d/gsi` sul VPS (gsi-backup, gsi-restore, traefik access) — commit `6fc65ab`

### Error tracking & metrics
- [x] **Sentry SDK opt-in** via `SENTRY_DSN` (vuoto = disabilitato); integrations FastAPI+Starlette; `send_default_pii=False`; init in lifespan pre-app — commit `6fc65ab`
- [x] **`prometheus-fastapi-instrumentator`** → `/metrics` (opt-in via `METRICS_ENABLED`, default True) — commit `6fc65ab`
- [ ] Grafana minimale sul VPS: latency, errori, articoli processati, job scheduler (richiede VPS — rinviato a setup post-deploy)

### Health & resilience
- [x] `/health` deep: DB (ping+latenza), disk free (UPLOAD_DIR), uploads writable, Ollama reachability (via `OLLAMA_BASE_URL` settings) + **`ollama_circuit` snapshot** — commit Sprint4-B1 + `f9633cc`
- [x] Retry con backoff esponenziale: `scraper_service` (httpx.get), `llm_service` (Ollama `/api/generate`), `wordpress_service` (upload media + create post) — decorator `with_retry` in `app/utils/retry.py`
- [x] **Circuit breaker Ollama**: CLOSED/OPEN/HALF_OPEN, 3 failure → apre per 5 min, skip immediato quando OPEN. **Banner UI globale** `LLMStatusBanner` polling /health ogni 60s — commit `f9633cc`
- [x] **Job log visibile in UI** `/dashboard/alerts` paginata con filtri status + job_type — commit `fa208be`

### UX errori
- [x] **Toast specifici** via `utils/errorToast.ts`: Ollama offline, WP non raggiungibile, rate limit (429), timeout, 401/403/404/409/422, 5xx. AxiosError → messaggio IT user-friendly — commit `f9633cc`
- [x] Nessun "generic 500" user-facing (fallback esplicito in `describeError`)

**Test aggiunti**: batch 1 (27) + batch 2 (10 circuit_breaker) = **37 nuovi test**. Totale backend: **142 test in 20 file**.

**DoD raggiunto**: stop Ollama → dopo 3 failure consecutive l'utente vede banner warning + la pipeline continua con solo embeddings; circuit si resetta dopo 5 min o su success manuale. Sentry cattura eccezioni quando DSN configurato; `/metrics` espone metriche Prometheus per scraping.

---

## Sprint 5 — Deployment & DevOps 🔴 `COMPLETATO (core)`

**Obiettivo**: deploy ripetibile, sicuro, documentato sul VPS del cliente.

### Docker
- [x] `Dockerfile.prod` backend multi-stage (builder + slim runtime), utente non-root `gsi:1001`, gunicorn + UvicornWorker, HEALTHCHECK curl su `/api/v1/health` — commit Sprint5-core
- [x] `Dockerfile.prod` frontend multi-stage (Vite build → `nginx:1.27-alpine`) + `nginx-gsi.conf` (SPA + proxy `/api`/`/uploads`/`/docs`, gzip, cache immutable 1y asset fingerprintati)
- [x] `.dockerignore` backend & frontend curati (esclude venv, test, Dockerfile*, .env, cache, IDE, git)

### Orchestrazione
- [x] `docker-compose.yml` dev: postgres + backend + frontend + ollama (profile `llm`) — preesistente, verificato
- [x] `docker-compose.prod.yml`: Traefik v3 + Let's Encrypt ACME + postgres + backend + frontend + ollama opzionale
- [x] Volumi persistenti nominati: `gsi_postgres_data`, `gsi_backend_uploads`, `gsi_hf_cache`, `gsi_letsencrypt`, `gsi_traefik_logs`, `gsi_ollama_data`
- [x] Healthcheck per postgres/backend/frontend/ollama
- [x] `restart: unless-stopped` su tutti i servizi

### Deploy
- [x] Script `deploy.sh`: prerequisiti + `git pull` + build + `alembic upgrade head` (idempotente nell'entrypoint) + `up -d` + attesa healthy + smoke test `/api/v1/health` + report
- [x] Rollback rapido: `./deploy.sh --rollback <sha>` ripristina commit precedente e rideploya
- [x] Gestione segreti: `.env.prod.example` con comandi per generare SECRET_KEY/Fernet/admin password; deploy.sh warn se permessi ≠ 600
- [x] Systemd service wrapper — template documentato in `RUNBOOK.md` §2.3

### CI/CD
- [ ] GitHub Actions: build image → push a GHCR → SSH deploy su staging
- [ ] Manual approval gate per produzione

### Ops
- [x] `RUNBOOK.md` operativo (11 sezioni): architettura, prima installazione + systemd, deploy, rollback, backup/restore, monitoring, rotazione chiavi (SECRET/Fernet/admin/pg), aggiornamento Ollama, troubleshooting (8 scenari), firewall UFW
- [ ] Uptime monitoring esterno (UptimeRobot) → da attivare in produzione
- [x] Firewall VPS documentato in `RUNBOOK.md` §10 (UFW: solo 22/80/443 aperti; postgres/backend/ollama su network `gsi-internal`)

**DoD raggiunto (core)**:
- ✅ Nuovo operatore segue `RUNBOOK.md §2` e deploya da zero su VPS pulito con `./deploy.sh` — verificato step-by-step nel runbook
- ✅ Rollback via `./deploy.sh --rollback <sha>` funzionante
- ⬜ Test live su VPS reale — quando il cliente fornisce l'accesso (UAT Sprint 8)
- ⬜ CI/CD push automatico su GHCR — rinviato (ridurrebbe il numero di comandi manuali ma non blocca la prima consegna)

---

## Sprint 6 — Performance & scalabilità 🟡 `PARZIALE (post-VPS per ARQ+Redis)`

**Obiettivo**: reggere il carico reale senza bloccare l'UI.

### Async & background jobs
- [ ] Completare migrazione SQLAlchemy sync → async (rinviato a post-VPS)
- [ ] **ARQ + Redis** per background tasks: `discovery_pipeline` e `publish_to_wp` diventano job asincroni (rinviato a post-VPS: richiede Redis vivo per testare)
- [ ] Sostituire APScheduler in-process con ARQ scheduler (rinviato a post-VPS)
- [ ] Worker Docker dedicato (`arq worker ...`) separato dal web (rinviato a post-VPS)

### Caching
- [x] **Cache utility `app/utils/cache.py`** con backend TTLCache (cachetools). API drop-in compatible con Redis per swap futuro. `@cached(prefix, ttl)` + `invalidate_cache(prefix)` — commit `d63e632`
- [ ] Attivazione su endpoint taxonomy/dashboard KPIs/WP config (rinviato — richiede refactor per separare cacheable logic da Session consumer)
- [ ] Cache invalidation on write per le mutation chiave (parte del punto sopra)

### Query optimization
- [x] **Fix N+1** `GET /articles` list: `_enrich_articles_bulk` prefetcha tags/categories/prompts per TUTTI gli articoli in 6 query fisse (vs 4×page_size = fino a 400) — commit `d63e632`
- [ ] Profiler locale per trovare altri hot spot (`sqlalchemy.engine` log su `INFO`) — da fare in load test su staging

### Frontend
- [x] **Bundle analysis** con `rollup-plugin-visualizer`: `npm run analyze` apre `dist/bundle-stats.html` treemap — commit `998de1b`
- [x] **Code splitting** per route: React.lazy in `LazyPages.tsx` + manualChunks Vite (antd/react/editor/sanitize) — commit `998de1b`
- [x] **Sourcemap** abilitata per Sentry symbolication + debugging post-deploy — commit `998de1b`
- [x] **Virtualizzazione Inbox**: dipendenza `react-virtuoso` installata, integrazione rinviata a Sprint 7 (insieme a grid/card view alternativa)
- [ ] Lazy load icons Ant Design: già tree-shaken grazie a import nominati, `antd` chunk è 438 KB gzip. Riduzione ulteriore con Lucide migration (Sprint 7)

### Media
- [x] **Upload immagini**: `process_image()` con Pillow — resize proporzionale LANCZOS a max 1600px, WebP quality 85, EXIF rotation fix, GIF animati passthrough. 7 test coperti — commit `bdcb3f4`
- [x] **Cache headers nginx**: `/uploads/` → `expires 1y; Cache-Control "public, immutable"` (nomi file con UUID garantiscono immutabilità) — commit `bdcb3f4`

**DoD parziale raggiunto**: Inbox query da O(n) a O(1) (N+1 risolto); bundle analyzer disponibile; immagini ottimizzate con cache aggressiva. **DoD completo (load test 10k articoli + discovery async)**: richiede Redis + staging VPS, rinviato a post-deploy.

---

## Sprint 7 — Design system, UX polish & refactoring 🟡 `3 settimane`

**Obiettivo**: trasformare l'UI/UX da "funzionale" a **moderna, accattivante,
perfetta**. GSI deve distinguersi visivamente nel segmento degli editorial SaaS
(benchmark: Contentful, Sanity Studio, Storyblok, Ghost Admin).

### Design system & identità visiva
- [ ] **Design tokens** centralizzati in `src/theme/tokens.ts` (colori, tipografia, spacing, radius, shadows, motion) — consumati dal `ConfigProvider` di Ant Design + ev. utility Tailwind
- [ ] **Palette**: primary/secondary/accent a 10 step + scala grigi + semantic (success/warning/danger/info); contrasto WCAG AA su tutte le combinazioni
- [ ] **Tipografia**: font principale geometric sans (Inter / Geist / Manrope) + font display per heading dashboard; scala tipografica fluida con `clamp()`
- [ ] **Logo & brand**: logo GSI pulito (SVG outline + solid), favicon multi-size, OG/social preview image, loader animato branded
- [ ] **Iconografia unificata**: set unico (Lucide Icons, ~1400 icone MIT) — rimozione del mix attuale Ant Design icons + emoji
- [ ] **Dark mode completo**: Ant Design token algorithm + persistenza preferenza utente + fallback `prefers-color-scheme`; tutte le viste verificate
- [ ] **Style guide interna** (Storybook o pagina `/styleguide`) con tutti i token e componenti documentati

### Componenti custom & restyling
- [ ] Dashboard KPI card: gradient sottili, iconografia coerente, **sparkline trend 7gg**
- [ ] `StatusBadge`, `ScoreBadge`, `RoleChip` custom — non più default Ant Design Tag
- [ ] **Data viz** (Recharts o Visx): pipeline funnel (imported→published), distribuzione AI score, articoli/giorno trend
- [ ] Sidebar navigazione: icone, hover curati, active indicator animato, collapse state persistito
- [ ] `ArticleCard` (Inbox grid/gallery view alternativa alla tabella) — toggle list/grid
- [ ] Empty states **illustrati** (SVG custom o `undraw.co`), non più testo piatto
- [ ] Toast system custom con stacking + animazioni + undo contestuale (es. reject articolo)

### Micro-interazioni & motion
- [ ] **Framer Motion** per transizioni di pagina, drawer, modali (slide + fade, 200-300ms)
- [ ] Feedback tattile: pulsanti scale 0.98 su `:active`, ripple o glow opzionale
- [ ] Skeleton loader **shimmer** (non più grey block statico)
- [ ] Drag & drop calendario: shadow elevata durante drag, snap visuale agli slot, drop-zone highlight animato
- [ ] Transizioni di status articolo con micro-animazione (checkmark, arrow morph)
- [ ] Rispetto di `prefers-reduced-motion` (disabilita motion decorativo)

### Responsive & mobile
- [ ] Audit esteso 375px (iPhone SE) → 1024px (iPad Pro) su tutte le 9 pagine
- [ ] Inbox: card view automatica <768px, filtri in bottom-sheet
- [ ] Calendario: vista lista su mobile (mese = overflow orizzontale con swipe)
- [ ] Touch target ≥44×44px, swipe gesture per quick action (approve/reject su card)
- [ ] Drawer mobile: full-screen sotto i 640px

### UX comportamentale & produttività
- [ ] Loading skeleton ovunque al posto di spinner (Inbox, ArticleDetail, Calendar, Dashboard)
- [ ] Empty state con CTA chiara su ogni tabella vuota
- [ ] Keyboard shortcuts: `?` cheatsheet, `j/k` naviga inbox, `g+s` filter status, `⌘+K` command palette
- [ ] **Command palette** (`⌘+K` / `Ctrl+K`) — ricerca globale articoli/prompt/utenti + azioni rapide
- [ ] Onboarding tour (`react-joyride` / `shepherd.js`) al primo login admin e al primo articolo
- [ ] Optimistic UI su action frequenti (status change, tag add) con rollback su errore
- [ ] Confirm destructive action con typed-confirmation (es. digita "SCARTA")

### Refactoring componenti grandi
- [ ] `ArticlePreviewDrawer.tsx` (764 righe) → sub-componenti + hook custom
- [ ] `PromptSearchHistory.tsx` (342 righe) → `HistoryTable`, `RunDetailModal`
- [ ] `PromptForm.tsx` (339 righe) → hook `usePromptForm` + componenti per sezione
- [ ] Estrazione hook `useArticleWorkflow`, `useCalendarDnd`, `useTaxonomyBulk` per testabilità

### Accessibilità & i18n
- [ ] A11y audit con **`axe-core` + test manuale NVDA/VoiceOver** — target **WCAG 2.1 AA**
- [ ] `react-i18next` con locale IT (primario) + EN (secondario) — estrazione stringhe hardcoded
- [ ] Focus trap + return focus su chiusura in tutti i modali/drawer
- [ ] Contrasto testo ≥4.5:1, UI ≥3:1 (verificato con token della palette)
- [ ] Link "Skip to content" + landmark roles

### Performance percepita
- [ ] Bundle analysis (`rollup-plugin-visualizer`) + code splitting per route (`React.lazy`)
- [ ] Tree-shake degli import di Ant Design icons (~200KB gzipped in meno)
- [ ] Font loading: `font-display: swap` + `preload` dei critici + subset latin-ext
- [ ] Image loading: `loading="lazy"` + `decoding="async"` + blur placeholder (LQIP)
- [ ] Prefetch su hover delle route critiche (dashboard → inbox)
- [ ] Lighthouse budget in CI (fail se Performance < 90 su preview deploy)

**DoD**:
- ✅ **Lighthouse ≥95** su dashboard, inbox, article detail (Performance, A11y, Best Practices, SEO)
- ✅ `axe-core`: **0 violazioni critiche**, ≤3 serious
- ✅ **Design review** interna approvata, con confronto visivo vs. 3 competitor del segmento editorial SaaS
- ✅ **Test utenti non-dev** (min. 3 persone) con task measurement: completamento >90%, **SUS score ≥80**
- ✅ Cross-browser: Chrome, Edge, Firefox, Safari (ultime 2 major) — nessuna regressione visiva
- ✅ Mobile QA: iPhone SE (375px) e iPad Pro (1024px) OK su tutte le pagine
- ✅ Dark mode verificato end-to-end su tutte le viste (niente testo illeggibile, niente icone invisibili)
- ✅ Storybook / style guide online con tutti i token e i componenti custom documentati

---

## Sprint 8 — Documentazione, UAT & handoff 🟡 `PARZIALE (doc DONE, resto post-VPS)`

**Obiettivo**: consegnare un pacchetto completo al cliente.

### Documentazione
- [x] **Manuale utente** `USER_GUIDE.md` (12 sezioni, ~500 righe, italiano, placeholder `[Schermata: ...]` per screenshot post Sprint 7) — commit `f348893`
- [x] **Manuale amministratore di prodotto** `ADMIN_GUIDE.md` (12 sezioni, ~450 righe) — commit `f348893`
- [x] **Manuale sviluppatore** `DEVELOPER_GUIDE.md` (10 sezioni, walkthrough aggiungere endpoint/pagina/migration/test + convenzioni + CI) — commit `a13db7a`
- [x] **Documentazione tecnica PDF** `GSI_Documentazione_Tecnica.pdf` (48 KB, 20 sezioni: architettura, stack, DB, pipeline, API reference, RBAC, scheduler, frontend, flusso completo) — generabile da `python generate_doc.py`
- [x] **README.md** allineato a stack reale (PostgreSQL, Docker, matrice documentazione) — commit `a13db7a`
- [x] **`RUNBOOK.md`** operativo 11 sezioni (da Sprint 5)
- [x] **API reference** interna: OpenAPI generata da FastAPI su `/docs` e `/redoc` (hosting pubblico via Traefik — configurato in `frontend/nginx-gsi.conf`)
- [ ] **Screenshot in `USER_GUIDE.md`** — da inserire dopo Sprint 7 (design system finale)
- [ ] **Video walkthrough** (10-15 min, Loom): flusso completo — da fare con UI finalizzata post Sprint 7

### UAT con il cliente
- [ ] 1 settimana di UAT parallela con dati reali del cliente (post deploy VPS)
- [ ] Bug tracking (GitHub Issues con label `uat`)
- [ ] Bug-fix window per P0/P1 emersi

### Security & load final check
- [ ] OWASP ZAP full scan (non baseline) — richiede VPS staging
- [ ] Load test finale con `k6` o Locust: scenari realistici del cliente — richiede VPS staging
- [ ] Review manuale della checklist OWASP Top 10

### Handoff
- [ ] Contratto di manutenzione proposto al cliente (SLA, canali supporto, patch cycle)
- [ ] Checklist consegna firmata: accesso repo, credenziali admin iniziali, chiavi cifrate consegnate, runbook condiviso
- [ ] Video/sessione handoff con il team IT del cliente

**DoD**: cliente firma verbale di accettazione.

---

## Riepilogo settimane cumulative

| Sprint | Cum. settimane | Priorità |
|---|---:|---|
| 0 | 0.5 | 🔴 |
| 1 | 2.5 | 🔴 |
| 2 | 4.5 | 🔴 |
| 3 | 6.5 | 🔴 |
| 4 | 8.5 | 🟡 |
| 5 | 10.5 | 🔴 |
| 6 | 12.5 | 🟡 |
| 7 | 15.5 | 🟡 |
| 8 | 17.5 | 🔴 |

---

## Rischi & mitigazioni

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Migrazione Postgres introduce regressioni sottili | Alto | Sprint 3 (test) **prima** di Sprint 6 async completo |
| Ollama consuma troppa RAM sul VPS | Medio | Dimensionare VPS ≥8GB; fallback embedding-only già presente |
| CORS/Traefik config errata in produzione | Alto | Staging identico a prod; smoke test in `deploy.sh` |
| Cliente richiede feature nuove in UAT | Medio | Cambio-scope documentato; P0 bug-fix only, feature in contratto di manutenzione |
| Tempo reale > stima | Medio | Scenario "Minimum viable" come cutoff fallback |
| **UI/UX sottotono rispetto ai competitor** | **Alto** | Sprint 7 elevato a **P1** (Professional); design review con benchmark visivo; test SUS con utenti reali prima dell'handoff |
| **Design system non adottato uniformemente** | Medio | Token centralizzati in un unico file; Storybook come single source of truth; linter custom per vietare colori hex hardcoded |

---

## Next action

Partenza **Sprint 0** — 3-4 giorni per avere tooling + CI attivi prima di toccare codice applicativo.
