# Global Shopping Insights (GSI)

Editorial intelligence platform for global retail & shopping news. Automates
discovery, scoring, and publishing of relevant articles to WordPress.

## Architecture

| Layer | Stack |
|---|---|
| Backend | FastAPI 0.115 + SQLAlchemy 2.0 + Alembic |
| Database | **PostgreSQL** (production) / SQLite (dev, zero-config) |
| Frontend | React 18 + TypeScript 5.6 + Ant Design 5 + Vite 5 |
| AI / NLP | sentence-transformers `all-MiniLM-L6-v2` + Ollama Qwen 2.5 3B (opt-in) |
| Search | DuckDuckGo (`ddgs`) |
| Scraping | Trafilatura + BeautifulSoup4 |
| Auth | JWT HS256 + bcrypt + refresh token rotation |
| Security | Fernet encryption (WP password), slowapi rate limit, CSP+HSTS headers |
| Deploy | Docker Compose + Traefik v3 + Let's Encrypt (prod) |
| Observability | structlog JSON + request-id + Sentry opt-in + Prometheus `/metrics` |

## Quick Start

### Con Docker (raccomandato)

Prerequisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) in esecuzione.

```powershell
# Windows
.\start.ps1
```
```bash
# Linux / macOS / Git Bash
./start.sh
```

Lo script avvia `postgres` + `backend` + `frontend`. L'entrypoint del backend
esegue automaticamente `alembic upgrade head` + `python seed.py` al primo avvio.

- Backend: http://localhost:8000/docs
- Frontend: http://localhost:5173
- **Login dev**: `admin@gsi.local` / `devpassword1234`

Altri comandi:
- `.\start.ps1 -Stop` / `./start.sh stop` — ferma i container (mantiene i volumi)
- `.\start.ps1 -Clean` / `./start.sh clean` — reset volumi (DB pulito)
- `.\start.ps1 -Logs` / `./start.sh logs` — segue i log
- `.\start.ps1 -WithLlm` / `./start.sh --with-llm` — abilita anche Ollama

### Senza Docker (venv)

<details><summary>Setup manuale (Windows PowerShell)</summary>

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
.\venv\Scripts\alembic.exe upgrade head
python seed.py
uvicorn app.main:app --reload
```

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```
</details>

Default admin (se `ADMIN_PASSWORD` non impostata in `.env`): il seed ne genera
una random e la stampa una volta sola.

API docs: http://localhost:8000/docs · App: http://localhost:5173

## Features

- **Search Prompts**: ricerche configurabili con scheduling (keywords, lingua,
  paese, time_depth, exclusion filters, cartelle gerarchiche)
- **Discovery Pipeline**: DuckDuckGo → scraping → dedup (URL + content hash)
  → embeddings score → LLM second-opinion (opt-in)
- **Editorial Workflow**: state machine 7 stati
  (imported → screened → in_review → approved → scheduled → publishing → published)
  con RBAC a 5 ruoli (admin > reviewer > editor > contributor > read_only)
- **Inbox**: filtri avanzati, batch actions, preview drawer
- **Editorial Calendar**: drag&drop mese/settimana/giorno, collision detection
- **WordPress Publishing**: REST API diretta con immagini + tassonomia
  bidirezionale + retry + audit trail
- **Taxonomy Sync**: tag e categorie sincronizzati bidirezionalmente con WP
- **Observability**: health deep (DB/disk/uploads/Ollama/circuit breakers),
  X-Request-ID correlato, structlog JSON, Sentry opt-in, Prometheus `/metrics`

## API

Tutti gli endpoint sotto `/api/v1/` (eccetto `/health`, `/metrics`).
Reference OpenAPI su `/docs` (Swagger UI) e `/redoc` (ReDoc).

## Documentazione

Per ruolo del lettore:

| Documento | Per chi | Contiene |
|---|---|---|
| [`USER_GUIDE.md`](./USER_GUIDE.md) | Utenti finali (editor, reviewer, contributor) | Flusso quotidiano: login, prompt, inbox, workflow, calendario, pubblicazione |
| [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md) | Amministratore di prodotto | Utenti/ruoli, config WordPress, tassonomia, blacklist, audit log |
| [`RUNBOOK.md`](./RUNBOOK.md) | IT/sysadmin del cliente | Deploy, backup/restore, rotazione chiavi, troubleshooting, firewall |
| [`CLAUDE.md`](./CLAUDE.md) | Sviluppatori (e Claude Code) | Convenzioni, struttura, comandi dev |
| [`PIANO_CONSEGNA.md`](./PIANO_CONSEGNA.md) | Stakeholder consegna | Sprint plan, stato, blocker, DoD |
| `GSI_Documentazione_Tecnica.pdf` | Architettura tecnica | Generata da `python generate_doc.py` |

## Deploy in produzione

Sul VPS del cliente: vedi [`RUNBOOK.md §2`](./RUNBOOK.md) per la prima
installazione. Ridotto all'osso:

```bash
git clone https://github.com/<org>/GlobalShoppingInsights.git app
cd app
cp .env.prod.example .env.prod
chmod 600 .env.prod
nano .env.prod           # genera SECRET_KEY / WP_ENCRYPTION_KEY / ADMIN_PASSWORD
./deploy.sh
```

Deploy successivi:

```bash
./deploy.sh              # pull + build + migrate + smoke test
./deploy.sh --rollback <sha>   # rollback rapido
```

## Test & quality

```bash
# Root
make lint          # ruff + eslint + prettier
make type-check    # mypy + tsc
make test          # pytest + vitest

# Singoli
cd backend && pytest --cov=app --cov-fail-under=50
cd frontend && npm run test
cd frontend && npm run analyze    # bundle analyzer (apre dist/bundle-stats.html)
```

CI su `push main` / PR: ruff + mypy + pytest (coverage gate 50%) + ESLint +
prettier + tsc + vitest + pip-audit + npm audit.

## Licenza

_[da definire con il cliente — proprietary / AGPL / MIT / ...]_
