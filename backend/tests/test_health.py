"""Test per l'endpoint /api/v1/health (deep check)."""

from __future__ import annotations

import os
import tempfile

from app.api import health as health_module


def test_health_ok_returns_200_and_status_ok(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] in ("ok", "degraded")
    assert "checks" in data
    assert data["checks"]["database"]["status"] == "ok"
    assert "latency_ms" in data["checks"]["database"]


def test_health_includes_version_and_env(client):
    r = client.get("/api/v1/health")
    data = r.json()
    assert "version" in data
    assert data["env"] == "test"


def test_health_ollama_skipped_by_default(client):
    # OLLAMA_BASE_URL="" di default → check skipped
    r = client.get("/api/v1/health")
    ollama = r.json()["checks"]["ollama"]
    assert ollama["status"] == "skipped"
    assert "reason" in ollama


def test_health_db_down_returns_503(client, monkeypatch):
    def fake_db():
        return {
            "status": "error",
            "error": "OperationalError",
            "message": "could not connect",
        }

    monkeypatch.setattr(health_module, "_check_db", fake_db)
    r = client.get("/api/v1/health")
    assert r.status_code == 503
    data = r.json()
    assert data["status"] == "error"
    assert data["checks"]["database"]["status"] == "error"


def test_health_disk_low_marks_degraded(client, monkeypatch):
    def fake_disk(*_args, **_kwargs):
        return {
            "status": "warning",
            "free_gb": 0.5,
            "total_gb": 50.0,
            "used_pct": 99.0,
            "path": "/app/uploads",
        }

    monkeypatch.setattr(health_module, "_check_disk", fake_disk)
    r = client.get("/api/v1/health")
    assert r.status_code == 200  # db ok → ancora servibile
    assert r.json()["status"] == "degraded"


def test_health_uploads_not_writable_marks_degraded(client, monkeypatch):
    def fake_uploads(_path):
        return {
            "status": "error",
            "error": "PermissionError",
            "message": "readonly",
            "path": "/app/uploads",
        }

    monkeypatch.setattr(health_module, "_check_uploads_writable", fake_uploads)
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "degraded"


def test_health_ollama_unreachable_marks_degraded(client, monkeypatch):
    monkeypatch.setattr(health_module.settings, "OLLAMA_BASE_URL", "http://127.0.0.1:1")
    # httpx fallirà per connection refused
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["checks"]["ollama"]["status"] == "error"
    assert data["status"] == "degraded"


def test_check_disk_helper_real_directory():
    with tempfile.TemporaryDirectory() as tmp:
        result = health_module._check_disk(tmp, min_free_gb=0.0001)
        assert result["status"] == "ok"
        assert result["free_gb"] > 0
        assert result["total_gb"] >= result["free_gb"]


def test_check_uploads_writable_helper():
    with tempfile.TemporaryDirectory() as tmp:
        result = health_module._check_uploads_writable(tmp)
        assert result["status"] == "ok"
        # Verifica che il probe sia stato rimosso
        assert not os.path.exists(os.path.join(tmp, ".health-probe"))


def test_check_ollama_skipped_when_not_configured():
    result = health_module._check_ollama("")
    assert result["status"] == "skipped"
