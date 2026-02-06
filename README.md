# Global Shopping Insights (GSI)

Editorial intelligence platform for global retail & shopping news. Automates discovery, scoring, and publishing of relevant articles to WordPress.

## Architecture

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + TypeScript + Ant Design + Vite
- **AI/ML**: sentence-transformers (all-MiniLM-L6-v2)
- **Search**: DuckDuckGo Search
- **Scraping**: Trafilatura + BeautifulSoup4

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```

Default admin: `admin@gsi.local` / `admin123`

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

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
