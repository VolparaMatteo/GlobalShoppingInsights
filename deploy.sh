#!/usr/bin/env bash
# ============================================================================
# GSI — deploy produzione sul VPS
#
# Uso (dal root del progetto):
#   ./deploy.sh          # deploy dall'ultimo main
#   ./deploy.sh --no-pull    # rebuild senza git pull (utile per test locale)
#   ./deploy.sh --rollback <sha>  # ripristina un commit precedente
#
# Requisiti:
#   - docker + docker compose plugin
#   - git
#   - .env.prod presente e popolato (copia .env.prod.example)
#   - Eseguito come utente con accesso a /var/run/docker.sock
# ============================================================================

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
BACKEND_CONTAINER="${BACKEND_CONTAINER:-gsi-backend-prod}"
SMOKE_RETRIES="${SMOKE_RETRIES:-24}"   # 24 × 5s = 2 min
SMOKE_DELAY="${SMOKE_DELAY:-5}"

# ---------- Helpers -------------------------------------------------------
c_red='\033[31m'; c_green='\033[32m'; c_yellow='\033[33m'; c_blue='\033[34m'; c_reset='\033[0m'
ts()   { date +%H:%M:%S; }
info() { echo -e "$(ts) ${c_green}[deploy]${c_reset} $*"; }
step() { echo -e "$(ts) ${c_blue}[deploy]${c_reset} ── $* ──"; }
warn() { echo -e "$(ts) ${c_yellow}[deploy]${c_reset} $*"; }
err()  { echo -e "$(ts) ${c_red}[deploy]${c_reset} $*" >&2; }

MODE="deploy"
ROLLBACK_SHA=""
DO_PULL=1

while [[ $# -gt 0 ]]; do
    case "$1" in
        --no-pull) DO_PULL=0; shift ;;
        --rollback) MODE="rollback"; ROLLBACK_SHA="${2:-}"; shift 2 ;;
        -h|--help)
            sed -n '2,18p' "$0"
            exit 0
            ;;
        *) err "Opzione sconosciuta: $1"; exit 1 ;;
    esac
done

# ---------- Prerequisiti --------------------------------------------------
step "Check prerequisiti"
command -v docker >/dev/null 2>&1 || { err "docker non trovato"; exit 1; }
docker info >/dev/null 2>&1      || { err "docker daemon non raggiungibile"; exit 1; }
command -v git >/dev/null 2>&1    || { err "git non trovato"; exit 1; }
test -f "${COMPOSE_FILE}" || { err "${COMPOSE_FILE} non trovato. Esegui da root progetto."; exit 1; }
test -f "${ENV_FILE}"     || { err "${ENV_FILE} non trovato. Copia .env.prod.example → ${ENV_FILE} e compila."; exit 1; }

# Permessi .env.prod (600 raccomandato, warn altrimenti)
if command -v stat >/dev/null 2>&1; then
    perms=$(stat -c '%a' "${ENV_FILE}" 2>/dev/null || echo "?")
    if [[ "${perms}" != "600" && "${perms}" != "400" ]]; then
        warn "${ENV_FILE} ha permessi ${perms} — raccomandato 600 (chmod 600 ${ENV_FILE})"
    fi
fi

# Spazio disco minimo 2GB liberi su /var/lib/docker
if df -BG /var/lib/docker 2>/dev/null | awk 'NR==2 {exit ($4+0 >= 2 ? 0 : 1)}'; then
    :
else
    err "Spazio insufficiente su /var/lib/docker (<2GB liberi). Rilascia spazio o: docker system prune -f"
    exit 1
fi

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")

# ---------- Rollback shortcut ---------------------------------------------
if [[ "${MODE}" = "rollback" ]]; then
    if [[ -z "${ROLLBACK_SHA}" ]]; then
        err "Uso: ./deploy.sh --rollback <sha>"
        exit 1
    fi
    step "Rollback a ${ROLLBACK_SHA}"
    git fetch --all
    git reset --hard "${ROLLBACK_SHA}"
    DO_PULL=0
fi

# ---------- Snapshot commit pre-deploy ------------------------------------
CURRENT_SHA=$(git rev-parse --short HEAD)
info "Commit pre-deploy: ${CURRENT_SHA}"

# ---------- Pull ----------------------------------------------------------
if [[ "${DO_PULL}" -eq 1 ]]; then
    step "git pull --ff-only"
    git pull --ff-only
fi
NEW_SHA=$(git rev-parse --short HEAD)
info "Commit deploy: ${NEW_SHA}"

# ---------- Build ---------------------------------------------------------
step "Build immagini"
"${COMPOSE[@]}" build

# ---------- Deploy --------------------------------------------------------
# `up -d` ricrea solo i container le cui immagini sono cambiate. Le
# migration Alembic girano nell'entrypoint del backend (idempotente).
step "Ricreo container (up -d)"
"${COMPOSE[@]}" up -d --remove-orphans

# ---------- Smoke test: health container ----------------------------------
step "Attendo backend healthy (max $((SMOKE_RETRIES * SMOKE_DELAY))s)"
for i in $(seq 1 "${SMOKE_RETRIES}"); do
    status=$(docker inspect -f '{{.State.Health.Status}}' "${BACKEND_CONTAINER}" 2>/dev/null || echo "missing")
    case "${status}" in
        healthy)
            info "Backend healthy al tentativo ${i}"
            break
            ;;
        starting)
            [[ $((i % 4)) -eq 0 ]] && info "… ancora starting (tentativo ${i}/${SMOKE_RETRIES})"
            ;;
        unhealthy)
            err "Backend in stato ${status}"
            "${COMPOSE[@]}" logs --tail=80 backend || true
            err ""
            err "Rollback rapido:  ./deploy.sh --rollback ${CURRENT_SHA}"
            exit 1
            ;;
        missing)
            warn "Container ${BACKEND_CONTAINER} non ancora visibile"
            ;;
    esac
    if [[ "${i}" -eq "${SMOKE_RETRIES}" ]]; then
        err "Timeout: backend non diventato healthy."
        "${COMPOSE[@]}" ps
        "${COMPOSE[@]}" logs --tail=120 backend || true
        err ""
        err "Rollback rapido:  ./deploy.sh --rollback ${CURRENT_SHA}"
        exit 1
    fi
    sleep "${SMOKE_DELAY}"
done

# ---------- Smoke test: end-to-end /health --------------------------------
step "Smoke test end-to-end"
if ! "${COMPOSE[@]}" exec -T backend \
        curl --fail --silent --show-error http://localhost:8000/api/v1/health > /dev/null; then
    err "Smoke test /api/v1/health fallito"
    err "Rollback rapido:  ./deploy.sh --rollback ${CURRENT_SHA}"
    exit 1
fi
info "✓ /api/v1/health OK"

# ---------- Report finale -------------------------------------------------
step "Stato servizi"
"${COMPOSE[@]}" ps
echo ""
info "Deploy completato: ${CURRENT_SHA} → ${NEW_SHA}"
info "Per log in tempo reale:  ${COMPOSE[*]} logs -f"
