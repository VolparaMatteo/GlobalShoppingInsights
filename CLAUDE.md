# CLAUDE.md

Guida operativa per Claude Code quando lavora su questo repository.

## Progetto

**Global Shopping Insights (GSI)** — Piattaforma di intelligence editoriale per news di retail/e-commerce. Scopre articoli sul web tramite prompt di ricerca, li valuta con AI (embeddings + LLM locale), applica un workflow editoriale multi-step con RBAC, e li pubblica su WordPress.

**Fase attuale**: preparazione alla consegna al cliente. Piano operativo in `PIANO_CONSEGNA.md`.

**Target di consegna**: VPS Linux del cliente + PostgreSQL + Docker.

## Stack

- **Backend**: Python 3.10+ / FastAPI 0.115 / SQLAlchemy 2.0 / PostgreSQL (prod) / SQLite (dev)
- **Frontend**: React 18 + TypeScript 5.6 / Vite 5.4 / Ant Design 5 / TanStack Query + Zustand
- **AI**: sentence-transformers `all-MiniLM-L6-v2` (embeddings) + Ollama Qwen 2.5 3B (LLM second-opinion)
- **Search**: DuckDuckGo via `ddgs` (gratuito)
- **Scraping**: Trafilatura + BeautifulSoup4
- **Scheduler**: APScheduler in-process → ARQ + Redis (pianificato Sprint 6)
- **Auth**: JWT HS256 + bcrypt, RBAC a 5 ruoli

## Struttura repo

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point + lifespan (scheduler)
│   ├── config.py            # settings (Pydantic Settings)
│   ├── database.py          # SQLAlchemy session
│   ├── api/                 # 13 router (auth, articles, prompts, calendar, ...)
│   ├── models/              # 15 tabelle ORM
│   ├── schemas/             # Pydantic request/response
│   ├── services/            # business logic (discovery, ai, llm, wordpress, ...)
│   ├── utils/               # security, helpers
│   └── workers/             # scheduler (APScheduler)
├── alembic/                 # migrazioni DB
├── tests/                   # pytest (da popolare in Sprint 3)
└── requirements.txt

frontend/src/
├── pages/                   # 9 pagine (dashboard, inbox, articles, calendar, ...)
├── components/common/       # componenti riusabili
├── hooks/queries/           # 14 hook React Query
├── services/api/            # client axios + moduli per ogni router
├── stores/                  # 4 store Zustand
├── types/                   # 17 file .types.ts
├── router/                  # React Router + ProtectedRoute + RoleGuard
└── layouts/                 # MainLayout + AuthLayout
```

## Comandi comuni

### Backend (dev)
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Linux/Mac
# venv\Scripts\activate                             # Windows
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
# OpenAPI: http://localhost:8000/docs
```

### Frontend (dev)
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

### Quality gates (attivi da Sprint 0)
```bash
# root
make lint          # ruff check + ruff format --check + eslint + prettier --check
make type-check    # mypy + tsc
make test          # pytest + vitest

# oppure, per backend / frontend separatamente
cd backend && ruff check . && ruff format --check . && mypy app && pytest
cd frontend && npm run lint && npm run format:check && npm run type-check && npm run test
```

### Deploy (dal Sprint 5)
```bash
# sul VPS del cliente
./deploy.sh  # pull → build → migrate → smoke test → switch
```

## Concetti dominio chiave

### Workflow articoli (state machine)
```
imported → screened → in_review → approved → scheduled → publishing → published
                                                              ↓
                                                         publish_failed (retry)
```
Le transizioni sono definite in `backend/app/api/articles.py` → `WORKFLOW_TRANSITIONS` + `TRANSITION_ROLES`. Ogni modifica qui **richiede aggiornamento dei test di workflow**.

### Ruoli (dal più permissivo al meno)
`admin` > `editor` > `reviewer` > `contributor` > `read_only`

Enforcement via `require_min_role()` dependency in FastAPI.

### Pipeline di discovery
1. DDGS search per keyword del prompt
2. Trafilatura scrape contenuto
3. Dedup (URL canonico + content hash SHA256)
4. Filtri: blacklist → lingua (`py3langid`) → data (`time_depth`) → embedding score (soglia 25)
5. LLM second opinion (Ollama Qwen): se `confidence > 0.85 && !relevant` → skip
6. Crea `Article` + link M:M al `Prompt`

File chiave: `backend/app/services/discovery_service.py` (414 righe).

## Convenzioni

- **Niente commenti "cosa fa" — solo "perché" quando non ovvio**
- Backend: `snake_case` funzioni, `PascalCase` classi, `UPPER_CASE` costanti
- Frontend: `camelCase` variabili, `PascalCase` componenti, file `.types.ts` separati
- Ogni nuovo endpoint: schema Pydantic + test + tipo TS + hook React Query
- **Mai** `any` in TypeScript
- HTML da fonti esterne: **sempre** componente `SafeHTML` (DOMPurify) lato frontend, `bleach` lato backend

## Non fare

- ❌ Committare segreti (`.env` è in `.gitignore`)
- ❌ Eseguire migrazioni SQL raw nel lifespan di FastAPI — **solo Alembic**
- ❌ Usare `except: pass` senza logging
- ❌ Abbassare la coverage dei test
- ❌ `git commit --no-verify` (pre-commit hooks sono intenzionali)
- ❌ Push diretto su `main` — solo via PR
- ❌ Modificare `WORKFLOW_TRANSITIONS`/`TRANSITION_ROLES` senza aggiornare i test
- ❌ Proporre soluzioni cloud-managed (RDS, Lambda, S3) senza conferma: target è VPS self-hosted

## Consegna

Il piano sprint completo è in **`PIANO_CONSEGNA.md`**. Ogni sprint ha Definition of Done espliciti — rispettarli prima di chiudere.

## Default admin (DEV ONLY)

`admin@gsi.local` / `admin123` — **DEVE essere rimosso/randomizzato prima della consegna** (Sprint 1, security hardening).
