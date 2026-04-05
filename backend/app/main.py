import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base
from app.api import auth, users, prompts, prompt_folders, search, articles, comments, calendar, publish, taxonomy, notifications, settings as settings_router, dashboard, export, health, unsplash


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Migration: add folder_id column to prompts table if missing
    try:
        with engine.connect() as conn:
            conn.execute(
                __import__("sqlalchemy").text(
                    "ALTER TABLE prompts ADD COLUMN folder_id INTEGER REFERENCES prompt_folders(id)"
                )
            )
            conn.commit()
    except Exception:
        pass
    # Migration: add parent_id column to prompt_folders table if missing
    try:
        with engine.connect() as conn:
            conn.execute(
                __import__("sqlalchemy").text(
                    "ALTER TABLE prompt_folders ADD COLUMN parent_id INTEGER REFERENCES prompt_folders(id)"
                )
            )
            conn.commit()
    except Exception:
        pass
    # Migration: add language_filtered column to search_runs table if missing
    try:
        with engine.connect() as conn:
            conn.execute(
                __import__("sqlalchemy").text(
                    "ALTER TABLE search_runs ADD COLUMN language_filtered INTEGER DEFAULT 0"
                )
            )
            conn.commit()
    except Exception:
        pass
    # Migration: add date_filtered column to search_runs table if missing
    try:
        with engine.connect() as conn:
            conn.execute(
                __import__("sqlalchemy").text(
                    "ALTER TABLE search_runs ADD COLUMN date_filtered INTEGER DEFAULT 0"
                )
            )
            conn.commit()
    except Exception:
        pass
    # Migration: add relevance_filtered column to search_runs table if missing
    try:
        with engine.connect() as conn:
            conn.execute(
                __import__("sqlalchemy").text(
                    "ALTER TABLE search_runs ADD COLUMN relevance_filtered INTEGER DEFAULT 0"
                )
            )
            conn.commit()
    except Exception:
        pass
    # Migration: add ai_relevance_comment column to articles table if missing
    try:
        with engine.connect() as conn:
            conn.execute(
                __import__("sqlalchemy").text(
                    "ALTER TABLE articles ADD COLUMN ai_relevance_comment TEXT"
                )
            )
            conn.commit()
    except Exception:
        pass
    try:
        from app.workers.scheduler import start_scheduler
        start_scheduler()
    except Exception:
        pass
    yield
    try:
        from app.workers.scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


app = FastAPI(
    title="Global Shopping Insights",
    description="Editorial intelligence platform for global retail & shopping news",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount all routers under /api/v1
PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(prompts.router, prefix=PREFIX)
app.include_router(prompt_folders.router, prefix=PREFIX)
app.include_router(search.router, prefix=PREFIX)
app.include_router(articles.router, prefix=PREFIX)
app.include_router(comments.router, prefix=PREFIX)
app.include_router(calendar.router, prefix=PREFIX)
app.include_router(publish.router, prefix=PREFIX)
app.include_router(publish.publish_jobs_router, prefix=PREFIX)
app.include_router(taxonomy.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(settings_router.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
app.include_router(export.router, prefix=PREFIX)
app.include_router(health.router, prefix=PREFIX)
app.include_router(unsplash.router, prefix=PREFIX)
