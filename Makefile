# ============================================================================
# GSI — Makefile
# Comandi canonici di sviluppo. Su Windows: Git Bash o WSL.
# ============================================================================

.PHONY: help install install-hooks \
        dev-backend dev-frontend \
        lint lint-backend lint-frontend lint-fix \
        format format-backend format-frontend \
        type-check type-check-backend type-check-frontend \
        test test-backend test-frontend test-coverage \
        clean

# ---- Help -------------------------------------------------------------------
help:
	@echo "Target disponibili:"
	@echo "  install              Installa dipendenze backend + frontend"
	@echo "  install-hooks        Installa i pre-commit hooks"
	@echo ""
	@echo "  dev-backend          Avvia backend FastAPI (reload)"
	@echo "  dev-frontend         Avvia frontend Vite"
	@echo ""
	@echo "  lint                 Lint completo (backend + frontend)"
	@echo "  lint-fix             Lint con auto-fix"
	@echo "  format               Formatta il codice"
	@echo "  type-check           Mypy + tsc"
	@echo "  test                 Esegue tutti i test"
	@echo "  test-coverage        Test con report coverage"
	@echo ""
	@echo "  clean                Rimuove cache/artefatti"

# ---- Install ----------------------------------------------------------------
install:
	cd backend && pip install -r requirements-dev.txt
	cd frontend && npm install

install-hooks:
	pre-commit install

# ---- Dev --------------------------------------------------------------------
dev-backend:
	cd backend && uvicorn app.main:app --reload

dev-frontend:
	cd frontend && npm run dev

# ---- Lint -------------------------------------------------------------------
lint: lint-backend lint-frontend

lint-backend:
	cd backend && ruff check .
	cd backend && ruff format --check .

lint-frontend:
	cd frontend && npm run lint
	cd frontend && npm run format:check

lint-fix:
	cd backend && ruff check --fix .
	cd backend && ruff format .
	cd frontend && npm run lint:fix
	cd frontend && npm run format

# ---- Format (alias) ---------------------------------------------------------
format: format-backend format-frontend

format-backend:
	cd backend && ruff format .

format-frontend:
	cd frontend && npm run format

# ---- Type check -------------------------------------------------------------
type-check: type-check-backend type-check-frontend

type-check-backend:
	cd backend && mypy app

type-check-frontend:
	cd frontend && npm run type-check

# ---- Test -------------------------------------------------------------------
test: test-backend test-frontend

test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm run test

test-coverage:
	cd backend && pytest --cov --cov-report=term-missing
	cd frontend && npm run test:coverage

# ---- Clean ------------------------------------------------------------------
clean:
	rm -rf backend/.pytest_cache backend/.mypy_cache backend/.ruff_cache
	rm -rf backend/htmlcov backend/.coverage
	rm -rf frontend/node_modules/.vite frontend/dist frontend/coverage
