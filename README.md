# Global Shopping Insights (GSI)

Editorial intelligence platform for global retail & shopping news. Automates discovery, scoring, and publishing of relevant articles to WordPress.

## Architecture

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + TypeScript + Ant Design + Vite
- **AI/ML**: sentence-transformers (all-MiniLM-L6-v2)
- **Search**: DuckDuckGo Search
- **Scraping**: Trafilatura + BeautifulSoup4

## Quick Start

### 🐳 Con Docker (raccomandato)

Prerequisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) in esecuzione.

```powershell
# Windows
.\start.ps1
```
```bash
# Linux / macOS / Git Bash
./start.sh
```

Lo script avvia `postgres` + `backend` + `frontend`. L'entrypoint del backend esegue automaticamente `alembic upgrade head` + `python seed.py` al primo avvio.

- Backend: http://localhost:8000/docs
- Frontend: http://localhost:5173
- **Login dev**: `admin@gsi.local` / `devpassword1234`

Altri comandi:
- `.\start.ps1 -Stop` / `./start.sh stop` — ferma i container (mantiene i volumi)
- `.\start.ps1 -Clean` / `./start.sh clean` — reset volumi (DB pulito)
- `.\start.ps1 -Logs` / `./start.sh logs` — segue i log
- `.\start.ps1 -WithLlm` / `./start.sh --with-llm` — abilita anche Ollama

### 🧪 Senza Docker (venv)

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

Default admin (se `ADMIN_PASSWORD` non impostata in `.env`): il seed ne genera una random e la stampa una volta sola.

API docs: http://localhost:8000/docs · App: http://localhost:5173

## Features

- **Search Prompts**: Define keyword-based searches with scheduling
- **Discovery Pipeline**: Automated search, scraping, and AI scoring
- **Inbox**: Filter, review, and batch-process articles
- **Workflow**: Multi-step editorial pipeline (Imported > Screened > In Review > Approved > Scheduled > Published)
- **Editorial Calendar**: Drag-and-drop scheduling with collision detection
- **WordPress Publishing**: Direct publishing via WP REST API
- **Taxonomy**: Tags and categories with WP sync
- **Role-Based Access**: Admin, Editor, Reviewer, Contributor, Read-Only

## API

All endpoints under `/api/v1/`. See `/docs` for OpenAPI documentation.
