# GSI — Manuale sviluppatore

Riferimento tecnico per chi estende o manutiene il codice di GSI. Complementa
`CLAUDE.md` (che resta la guida operativa) con esempi concreti di estensione.

> Se sei amministratore di prodotto o utente finale, vedi `ADMIN_GUIDE.md` /
> `USER_GUIDE.md`. Se devi deployare in produzione, vedi `RUNBOOK.md`.

---

## Indice

1. [Setup ambiente dev](#1-setup-ambiente-dev)
2. [Architettura a layer](#2-architettura-a-layer)
3. [Convenzioni di codice](#3-convenzioni-di-codice)
4. [Aggiungere un endpoint](#4-aggiungere-un-endpoint)
5. [Aggiungere una pagina frontend](#5-aggiungere-una-pagina-frontend)
6. [Aggiungere una migration DB](#6-aggiungere-una-migration-db)
7. [Scrivere test](#7-scrivere-test)
8. [Osservabilità: logging, retry, circuit breaker](#8-osservabilità-logging-retry-circuit-breaker)
9. [Security: segreti, password, token](#9-security-segreti-password-token)
10. [CI / qualità](#10-ci--qualità)

---

## 1. Setup ambiente dev

Due modalità, sempre equivalenti:

**Docker** (raccomandato per iniziare):
```bash
./start.sh            # avvia postgres + backend + frontend
./start.sh --with-llm # aggiunge Ollama (4 GB RAM extra)
./start.sh stop       # ferma
./start.sh clean      # reset volumi (DB pulito)
```

**venv** (iterazione veloce di codice Python):
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Linux/Mac
#  venv\Scripts\activate                         # Windows
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
python seed.py
uvicorn app.main:app --reload

# In un altro terminale
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Login dev di default**: `admin@gsi.local` / `devpassword1234`.

---

## 2. Architettura a layer

### Backend

```
HTTP request
      │
      ▼
┌──────────────────┐
│  app/api/*.py    │  Router FastAPI: validazione Pydantic + RBAC dependency
│  (Router layer)  │  → non contiene logica di business
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│app/services/*.py │  Logica di business: discovery, AI, LLM, WordPress,
│ (Service layer)  │  taxonomy sync. Nessun riferimento a FastAPI.
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│app/models/*.py   │  SQLAlchemy ORM. Definisce schema, relazioni.
│  (Model layer)   │  Mai logica di business qui (solo `__repr__`, proprietà derivate).
└────────┬─────────┘
         │
         ▼
  PostgreSQL / SQLite
```

Utility trasversali in `app/utils/`: security, encryption, retry, logging,
image_processing, circuit_breaker, cache.

### Frontend

```
Pages (pages/*.tsx)
    │
    ├─ Hooks (hooks/queries/*.ts) — useQuery + useMutation
    │       │
    │       ▼
    │   Services (services/api/*.ts) — axios client
    │       │
    │       ▼
    │   Backend HTTP
    │
    └─ Stores (stores/*.ts) — Zustand per stato globale (auth, UI, calendario)
```

`types/` è il contratto: mirror in TS dei modelli backend. Ogni nuovo endpoint
aggiunge tipi qui.

---

## 3. Convenzioni di codice

### Backend (Python)

- **snake_case** per funzioni e variabili, **PascalCase** per classi,
  **UPPER_CASE** per costanti module-level
- Type hints sempre su firma pubblica. `from __future__ import annotations` nei
  file con molti `list[]` / `dict[]` / union types per mantenere Python 3.10
  backward compat
- Docstring triple-quoted solo su funzioni non triviali. Lo scopo è "perché",
  non "cosa fa"
- **Niente `except: pass`** — `logger.exception(...)` sempre
- **Ruff** è la fonte della verità per formato: `quote-style=double`,
  `line-length=100`, `line-ending=lf`

### Frontend (TypeScript)

- **camelCase** per variabili/funzioni, **PascalCase** per componenti e tipi
- File `.tsx` per componenti React, `.ts` per utility
- Ogni tipo di dominio in `src/types/<entita>.types.ts`, riesportato da
  `types/index.ts`
- **Mai `any`** — se il tipo è sconosciuto usa `unknown` e narrowing esplicito
- **Prettier** è la fonte della verità: single quotes, trailing comma all,
  `endOfLine: lf`
- HTML da fonti esterne → sempre componente `SafeHTML` (DOMPurify wrapper)

### Commit

Convenzione `<type>(<scope>): <subject>`:
- `feat(observability): Sprint 4 batch 1 — structlog + retry + ...`
- `fix(security): password policy — ...`
- `chore(ci): mypy baseline — ...`
- `docs(piano): stato verificato al 2026-04-22`
- `test: RBAC comprehensive su 18 endpoint × 5 ruoli`

---

## 4. Aggiungere un endpoint

Esempio: aggiungere `POST /api/v1/articles/{id}/archive`.

### 4.1 Schema Pydantic (`backend/app/schemas/article.py`)

Se il body ha shape nuova:

```python
class ArchiveRequest(BaseModel):
    reason: str | None = None
```

### 4.2 Router (`backend/app/api/articles.py`)

```python
@router.post("/{article_id}/archive", response_model=MessageResponse)
def archive_article(
    article_id: int,
    body: ArchiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role("editor")),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # ... logica (idealmente in un service se complessa)

    return MessageResponse(message="Archived")
```

### 4.3 Test (`backend/tests/test_articles.py`)

```python
def test_archive_requires_editor(client, headers_for, article_factory):
    art = article_factory(status="approved")
    # Contributor non può
    r = client.post(f"/api/v1/articles/{art.id}/archive",
                    headers=headers_for("contrib@x.com", role="contributor"),
                    json={"reason": "outdated"})
    assert r.status_code == 403

    # Editor sì
    r = client.post(f"/api/v1/articles/{art.id}/archive",
                    headers=headers_for("edit@x.com", role="editor"),
                    json={"reason": "outdated"})
    assert r.status_code == 200
```

### 4.4 Client API frontend (`frontend/src/services/api/articles.api.ts`)

```typescript
export interface ArchiveRequest {
  reason?: string;
}

export async function archiveArticle(
  id: number,
  body: ArchiveRequest,
): Promise<MessageResponse> {
  const { data } = await client.post<MessageResponse>(
    `/articles/${id}/archive`,
    body,
  );
  return data;
}
```

### 4.5 Hook React Query (`frontend/src/hooks/queries/useArticle.ts`)

```typescript
export function useArchiveArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ArchiveRequest }) =>
      archiveArticle(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
    },
  });
}
```

### 4.6 Usarlo nella UI

```tsx
const archive = useArchiveArticle();

<Button onClick={() => archive.mutate({ id: article.id, data: {} })}>
  Archivia
</Button>
```

---

## 5. Aggiungere una pagina frontend

Esempio: pagina `/reports`.

1. **Componente pagina**: `frontend/src/pages/reports/ReportsPage.tsx`
2. **Lazy export**: in `frontend/src/router/LazyPages.tsx`:
   ```typescript
   export const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
   ```
3. **Route**: in `frontend/src/router/index.tsx`:
   ```typescript
   { path: '/reports', element: suspense(ReportsPage) }
   ```
4. **Link in sidebar**: `frontend/src/layouts/components/AppSider.tsx`
5. **RBAC**: avvolgi la route con `<RoleGuard role="editor">` se serve

---

## 6. Aggiungere una migration DB

**Flusso Alembic** (autogenerate da modello):

```bash
cd backend
# 1. Modifica il modello in app/models/
# 2. Genera la migration
alembic revision --autogenerate -m "add field x to articles"

# 3. Revisiona il file in alembic/versions/ e aggiustalo se serve
#    (Alembic non rileva sempre enum changes, rename columns, ecc.)

# 4. Applica localmente
alembic upgrade head

# 5. Lancia i test
pytest
```

**Non eseguire mai `CREATE TABLE` raw in `lifespan` di FastAPI** — Alembic è
la singola fonte di verità per lo schema.

Per rollback locale:
```bash
alembic downgrade -1  # torna di 1 migration
```

---

## 7. Scrivere test

**Backend** (`backend/tests/`):

Fixture disponibili in `conftest.py`:
- `db` — sessione SQLAlchemy con rollback automatico a fine test
- `client` — TestClient FastAPI
- `headers_for(email, role="admin")` — helper per request autenticate
- `article_factory(...)` — crea Article con default ragionevoli
- `user_factory(...)` — crea User

Marker disponibili:
- `@pytest.mark.slow` — test lenti (escludi con `-m 'not slow'`)
- `@pytest.mark.integration` — richiede servizi esterni
- `@pytest.mark.e2e` — end-to-end completi

Coverage gate CI: `--cov-fail-under=50`. Alzare gradualmente.

**Frontend** (`frontend/src/**/__tests__/`):

- **Vitest + @testing-library/react** — file `*.test.tsx` accanto al componente
- Pattern: `describe` + `it` con arrange/act/assert espliciti
- Non montare il QueryClientProvider in ogni test — usare l'helper `renderWithProviders` quando verrà creato (Sprint 7)

---

## 8. Osservabilità: logging, retry, circuit breaker

### Logging

Usa sempre **structlog** via:

```python
import structlog
log = structlog.get_logger(__name__)

log.info("prompt.run.started", prompt_id=prompt.id, user_id=user.id)
log.exception("wp.publish.failed", article_id=article.id)
```

Output:
- **dev/test**: ConsoleRenderer (colorato, human-readable)
- **production**: JSONRenderer → viene ingerito da Docker logs / Sentry

Il middleware `RequestIdMiddleware` inietta `request_id` in ogni log della
request. Propagato via `X-Request-ID` header (client può forwardarlo).

**PII masking**: processor `_mask_secrets` nasconde automaticamente substring
`password`, `token`, `authorization`, `secret`, `api_key`, `wp_app_password`,
`encryption_key`.

### Retry

Per chiamate HTTP a servizi esterni (scraper, Ollama, WordPress):

```python
from app.utils.retry import with_retry

@with_retry(max_attempts=3, initial_delay=1.0, backoff=2.0)
def fetch_something():
    resp = httpx.get("https://...")
    resp.raise_for_status()
    return resp.json()
```

Retry automatico su timeout / connect / 5xx. **Mai** retry su 4xx.

### Circuit breaker

Per servizi esterni instabili (Ollama):

```python
from app.utils.circuit_breaker import CircuitBreaker

_breaker = CircuitBreaker(name="ollama", failure_threshold=3, reset_timeout=300.0)

def call_ollama(...):
    if _breaker.is_open():
        return fallback()
    try:
        result = do_call()
    except Exception:
        _breaker.record_failure()
        raise
    _breaker.record_success()
    return result
```

Lo stato è esposto via `/health` (`checks.ollama_circuit`) — il frontend mostra
banner quando è OPEN (vedi `LLMStatusBanner.tsx`).

---

## 9. Security: segreti, password, token

### Segreti

Tre chiavi critiche, mai committate:
- `SECRET_KEY` — JWT signing (min 32 char)
- `WP_ENCRYPTION_KEY` — Fernet, cifratura wp_app_password
- `ADMIN_PASSWORD` — admin iniziale (in dev auto-random da seed.py se default)

Validator in `app/config.py` rifiuta l'avvio con `ENV=production` se una di
queste è al default.

### Password utente

Policy in `app/schemas/user.py`:
- min 12 caratteri
- blacklist password comuni (`admin123`, `password1234`, ...)
- hash bcrypt + salt

### JWT + refresh rotation

Access token 30 min, refresh token 7 giorni. Ogni refresh revoca il vecchio
(tabella `refresh_tokens` con `revoked_at`). Logout revoca immediatamente.

### Rate limit

`slowapi` su endpoint sensibili:
- `/auth/login` 5/min
- `/auth/refresh` 20/min
- `/publish/{id}` 10/min
- `/prompts/{id}/run` 20/min

In `ENV=test` il limiter è no-op (via `app/utils/rate_limit.py`).

### HTML esterno

- Backend: `bleach.clean(html)` prima di salvare
- Frontend: componente `SafeHTML` (DOMPurify) per rendering di contenuti
  articolo, commenti, qualsiasi HTML proveniente da fonte esterna

---

## 10. CI / qualità

Workflow `.github/workflows/ci.yml`:

**Job `backend`**:
1. `ruff check .` — lint
2. `ruff format --check .` — formato
3. `mypy app` — type check (baseline permissiva, vedi pyproject.toml)
4. `pytest --cov=app --cov-fail-under=50` — test + coverage gate

**Job `frontend`**:
1. `npm run lint` — ESLint (0 errors; warnings permessi)
2. `npm run format:check` — Prettier
3. `npm run type-check` — tsc
4. `npm run test` — Vitest

**Job `dependency-audit`** (advisory, non bloccante):
1. `pip-audit --ignore-vuln PYSEC-2022-252` — vuln backend
2. `npm audit --audit-level=high` — vuln frontend

**Pre-commit hooks** (`.pre-commit-config.yaml`): installa con
`make install-hooks`. Esegue ruff + prettier + trailing-whitespace +
detect-private-key su ogni commit. **Mai usare `--no-verify`** per bypassarli.

### Comandi comuni

```bash
# Root
make lint          # tutti i linter
make test          # tutti i test
make type-check    # mypy + tsc

# Backend
cd backend
ruff check . && ruff format --check .
ruff check . --fix     # autofix
mypy app
pytest                  # tutti
pytest -k test_workflow # solo match nome
pytest --cov=app --cov-report=html  # report HTML in htmlcov/

# Frontend
cd frontend
npm run lint
npm run format          # autofix
npm run type-check
npm run test
npm run test:coverage   # copertura
npm run analyze         # bundle analyzer → dist/bundle-stats.html
```

---

*Ultimo aggiornamento: 2026-04-22 (Sprint 4 + 6 + 8 commitati, Sprint 7 in roadmap).*
