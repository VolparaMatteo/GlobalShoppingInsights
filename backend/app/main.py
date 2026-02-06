from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api import auth, users, prompts, search, articles, comments, calendar, publish, taxonomy, notifications, settings as settings_router, dashboard, export, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
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

# Mount all routers under /api/v1
PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(prompts.router, prefix=PREFIX)
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
