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
| **Professional** ⭐ raccomandato | + 4 · 6 | ~13 settimane |
| **Perfect** | tutti (+ 7) | ~16 settimane |

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

## Sprint 4 — Observability & error handling 🟡 `2 settimane`

**Obiettivo**: in produzione sappiamo subito cosa è successo e perché.

### Logging
- [ ] `structlog` con output JSON
- [ ] Request ID correlato propagato in tutti i log di una request
- [ ] No PII nei log (filtro per `email`, `password`, `wp_app_password`)
- [ ] Log rotation: `logrotate` config sul VPS

### Error tracking & metrics
- [ ] Sentry (SaaS free tier) o GlitchTip self-hosted su VPS
- [ ] `prometheus-fastapi-instrumentator` → endpoint `/metrics`
- [ ] Grafana minimale sul VPS: latency, errori, articoli processati, job scheduler

### Health & resilience
- [ ] `/health` deep: DB, Ollama, WP reachability, disk space, Redis (quando presente)
- [ ] Retry con backoff esponenziale: scraper, WP publish, LLM
- [ ] Circuit breaker per Ollama: se offline >5min → skip LLM + banner UI globale
- [ ] Job log visibile in UI (`/dashboard/alerts`) filtrabile per severità

### UX errori
- [ ] Toast specifici: "Ollama offline", "WP non raggiungibile", "Rate limit", "Timeout scraping"
- [ ] Nessun "generic 500" user-facing

**DoD**: stop Ollama → utente vede banner, pipeline continua con solo embeddings, Sentry registra warning, Grafana mostra drop del counter LLM.

---

## Sprint 5 — Deployment & DevOps 🔴 `2 settimane`

**Obiettivo**: deploy ripetibile, sicuro, documentato sul VPS del cliente.

### Docker
- [ ] `Dockerfile` backend multi-stage (builder + slim runtime), non-root user, healthcheck
- [ ] `Dockerfile` frontend multi-stage (build Vite → Nginx alpine)
- [ ] `.dockerignore` curato (no `node_modules`, no `venv`, no `.git`)

### Orchestrazione
- [ ] `docker-compose.yml` dev: backend + postgres + ollama + frontend + redis
- [ ] `docker-compose.prod.yml`: + Traefik con Let's Encrypt automatico
- [ ] Volumi persistenti per: postgres data, uploads, modelli Ollama, certificati
- [ ] Healthcheck per ogni servizio
- [ ] Policy `restart: unless-stopped`

### Deploy
- [ ] Script `deploy.sh`: git pull → build → `alembic upgrade head` → restart blue-green → smoke test
- [ ] Rollback automatico se smoke test fallisce
- [ ] Gestione segreti: `.env` sul VPS con `chmod 600`, mai in repo
- [ ] Systemd service wrapper per `docker compose up` (resiste a reboot VPS)

### CI/CD
- [ ] GitHub Actions: build image → push a GHCR → SSH deploy su staging
- [ ] Manual approval gate per produzione

### Ops
- [ ] Runbook operativo (`RUNBOOK.md`): restart, backup/restore, rollback, log, aggiornamento modello Ollama, rotazione chiavi
- [ ] Uptime monitoring esterno (UptimeRobot free) → alert email al primo downtime
- [ ] Firewall VPS: solo 22 (SSH), 80, 443 aperti; Postgres/Redis/Ollama solo su network interna Docker

**DoD**: un nuovo operatore segue `RUNBOOK.md` e deploya da zero su un VPS pulito in <1h. Rollback testato.

---

## Sprint 6 — Performance & scalabilità 🟡 `2 settimane`

**Obiettivo**: reggere il carico reale senza bloccare l'UI.

### Async & background jobs
- [ ] Completare migrazione SQLAlchemy sync → async (se non fatta in Sprint 2)
- [ ] **ARQ + Redis** per background tasks: `discovery_pipeline` e `publish_to_wp` diventano job asincroni
- [ ] Sostituire APScheduler in-process con ARQ scheduler (distribuibile, persistente)
- [ ] Worker Docker dedicato (`arq worker ...`) separato dal web

### Caching
- [ ] Redis cache: taxonomy, dashboard KPIs, user permissions (TTL 60s), WP config
- [ ] Cache invalidation on write per le mutation chiave

### Query optimization
- [ ] Fix N+1 query nelle list articles (eager loading di tags/categories/prompts)
- [ ] Profiler locale per trovare hot spot (`sqlalchemy.engine` log su `INFO`)

### Frontend
- [ ] Bundle analysis con `rollup-plugin-visualizer`
- [ ] Lazy load icons Ant Design (risparmio ~200KB gzipped)
- [ ] Virtualizzazione tabella Inbox (`react-virtuoso`) oltre 1000 righe
- [ ] Code splitting per route (`React.lazy` già parziale — completare)

### Media
- [ ] Upload immagini: resize + compressione WebP con Pillow
- [ ] Cache headers per immagini (Cache-Control, ETag via Nginx)

**DoD**: load test con 10k articoli. Inbox <500ms, dashboard <300ms, discovery async non blocca request HTTP.

---

## Sprint 7 — UX polish & refactoring 🟢 `2 settimane`

**Obiettivo**: consegna con look & feel di prodotto maturo.

### Refactoring componenti grandi
- [ ] `ArticlePreviewDrawer.tsx` (764 righe) → sub-componenti
- [ ] `PromptSearchHistory.tsx` (342 righe) → estrarre `HistoryTable`, `RunDetailModal`
- [ ] `PromptForm.tsx` (339 righe) → hook `usePromptForm` + componenti per ogni sezione

### UX
- [ ] Loading skeletons al posto di spinner (Inbox, ArticleDetail, Calendar)
- [ ] Empty states con call-to-action chiara su ogni tabella vuota
- [ ] Keyboard shortcuts: `?` cheatsheet, `j/k` navigazione inbox, `g+s` filtro status
- [ ] Onboarding tour (`react-joyride`) al primo login dell'admin
- [ ] Dark mode toggle in UserMenu (Ant Design lo supporta già)
- [ ] Mobile/tablet responsive audit (Inbox + Calendar)

### Accessibilità & i18n
- [ ] A11y audit con `axe-core` — almeno WCAG 2.1 AA
- [ ] `react-i18next` con locale IT + EN
- [ ] Focus management nei modali

**DoD**: Lighthouse score ≥90 su dashboard, inbox, article detail. `axe` senza violazioni critiche. Tour onboarding testato da 2 utenti non-dev.

---

## Sprint 8 — Documentazione, UAT & handoff 🔴 `2 settimane`

**Obiettivo**: consegnare un pacchetto completo al cliente.

### Documentazione
- [ ] **Manuale utente** (PDF, italiano, screenshot) — aggiornare `generate_doc.py`
- [ ] **Manuale amministratore**: deploy, backup/restore, troubleshooting, aggiornamento Ollama, rotazione chiavi, gestione utenti
- [ ] **Manuale sviluppatore**: `CLAUDE.md` espanso, architettura, come aggiungere un endpoint/pagina
- [ ] **API reference** pubblica: OpenAPI + ReDoc hosted
- [ ] **Video walkthrough** (10-15 min, Loom): flusso completo
- [ ] **`RUNBOOK.md`** operativo (dallo Sprint 5, ora rifinito)

### UAT con il cliente
- [ ] 1 settimana di UAT parallela con dati reali del cliente
- [ ] Bug tracking (GitHub Issues con label `uat`)
- [ ] Bug-fix window per P0/P1 emersi

### Security & load final check
- [ ] OWASP ZAP full scan (non baseline)
- [ ] Load test finale con `k6` o Locust: scenari realistici del cliente
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
| 7 | 14.5 | 🟢 |
| 8 | 16.5 | 🔴 |

---

## Rischi & mitigazioni

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Migrazione Postgres introduce regressioni sottili | Alto | Sprint 3 (test) **prima** di Sprint 6 async completo |
| Ollama consuma troppa RAM sul VPS | Medio | Dimensionare VPS ≥8GB; fallback embedding-only già presente |
| CORS/Traefik config errata in produzione | Alto | Staging identico a prod; smoke test in `deploy.sh` |
| Cliente richiede feature nuove in UAT | Medio | Cambio-scope documentato; P0 bug-fix only, feature in contratto di manutenzione |
| Tempo reale > stima | Medio | Scenario "Minimum viable" come cutoff fallback |

---

## Next action

Partenza **Sprint 0** — 3-4 giorni per avere tooling + CI attivi prima di toccare codice applicativo.
