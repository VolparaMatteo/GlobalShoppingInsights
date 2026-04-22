# ============================================================================
# GSI Backend — development image
# Single-stage: monta il codice come volume in docker-compose per hot-reload.
# Per produzione (Sprint 5) creeremo una Dockerfile.prod multi-stage con slim
# runtime, non-root user e gunicorn.
# ============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps: lxml/Pillow servono build tools; postgres-client per pg_isready.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libxml2-dev \
        libxslt1-dev \
        libjpeg-dev \
        zlib1g-dev \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies (layer caching: solo cambi di requirements invalidano).
COPY requirements.txt requirements-dev.txt ./
RUN pip install -r requirements-dev.txt

# Code (in dev sarà sovrascritto dal volume mount).
COPY . .

# Entry script che fa: wait-for-db → alembic upgrade → seed → uvicorn.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Normalizza line endings in caso di checkout Windows (CRLF → LF).
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

CMD ["docker-entrypoint.sh"]
