#!/usr/bin/env bash
# ============================================================================
# GSI — start script (Linux/macOS/Git Bash)
# Avvia l'intero stack tramite Docker Compose.
#
# Uso:
#   ./start.sh                           # avvia tutto
#   ./start.sh --with-llm                # + servizio ollama
#   ./start.sh stop                      # ferma (mantiene i volumi)
#   ./start.sh clean                     # ferma e cancella VOLUMI (DB + uploads)
#   ./start.sh logs [servizio]
#   ./start.sh rebuild                   # forza rebuild immagini
#   ./start.sh refresh-frontend-deps     # ricrea il volume node_modules
#                                        # (usare dopo aver aggiunto/rimosso
#                                        # dipendenze in frontend/package.json)
#   ./start.sh refresh-backend-deps      # rebuild immagine backend
#                                        # (usare dopo cambio requirements.txt)
# ============================================================================

set -euo pipefail

PROFILE_ARGS=()
if [[ "${1:-}" == "--with-llm" ]]; then
    PROFILE_ARGS=("--profile" "llm")
    shift
fi

command -v docker >/dev/null 2>&1 || {
    echo "ERRORE: docker non trovato nel PATH."
    echo "Installa Docker: https://www.docker.com/products/docker-desktop/"
    exit 1
}

docker info >/dev/null 2>&1 || {
    echo "ERRORE: il daemon Docker non è in esecuzione."
    exit 1
}

CMD="${1:-up}"

case "$CMD" in
    stop|down)
        echo "Fermo i container (mantengo i volumi)..."
        docker compose "${PROFILE_ARGS[@]}" down
        ;;
    clean)
        read -rp "Cancellare DB, uploads e modelli Ollama? (digita 'yes'): " CONF
        [[ "$CONF" != "yes" ]] && { echo "Annullato."; exit 0; }
        docker compose "${PROFILE_ARGS[@]}" down -v
        ;;
    logs)
        docker compose "${PROFILE_ARGS[@]}" logs -f "${2:-}"
        ;;
    rebuild)
        docker compose "${PROFILE_ARGS[@]}" up -d --build
        ;;
    refresh-frontend-deps)
        echo "Refresh node_modules frontend (dopo cambio package.json)..."
        docker compose "${PROFILE_ARGS[@]}" stop frontend || true
        docker compose "${PROFILE_ARGS[@]}" rm -f frontend || true
        docker volume rm gsi-dev_frontend_node_modules 2>/dev/null || true
        echo "Volume node_modules rimosso. Rebuild immagine frontend..."
        docker compose "${PROFILE_ARGS[@]}" build frontend
        docker compose "${PROFILE_ARGS[@]}" up -d
        echo "Fatto. Frontend ripartito su http://localhost:5173"
        ;;
    refresh-backend-deps)
        echo "Rebuild immagine backend (dopo cambio requirements.txt)..."
        docker compose "${PROFILE_ARGS[@]}" stop backend || true
        docker compose "${PROFILE_ARGS[@]}" build backend
        docker compose "${PROFILE_ARGS[@]}" up -d
        echo "Fatto. Backend ripartito su http://localhost:8000"
        ;;
    up|"")
        docker compose "${PROFILE_ARGS[@]}" up -d
        cat <<'EOF'

================================================================
  GSI in esecuzione
================================================================
  Backend  : http://localhost:8000/docs
  Frontend : http://localhost:5173

  Login    : admin@gsi.local
  Password : devpassword1234  (DEV ONLY)

  Log completi : ./start.sh logs
  Solo backend : docker compose logs -f backend
  Stop         : ./start.sh stop
  Reset DB     : ./start.sh clean
================================================================
EOF
        ;;
    *)
        echo "Uso: $0 [up|stop|clean|logs [servizio]|rebuild] [--with-llm]"
        exit 1
        ;;
esac
