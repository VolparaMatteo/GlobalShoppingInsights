# ============================================================================
# GSI — start script (Windows PowerShell)
# Avvia l'intero stack tramite Docker Compose.
#
# Uso:
#   .\start.ps1                        # avvia tutto (postgres + backend + frontend)
#   .\start.ps1 -WithLlm               # + servizio ollama (LLM second-opinion)
#   .\start.ps1 -Stop                  # ferma i container (mantiene i volumi)
#   .\start.ps1 -Clean                 # ferma e cancella VOLUMI (DB + uploads + ollama)
#   .\start.ps1 -Logs                  # segue i log di tutti i servizi
#   .\start.ps1 -Rebuild               # forza rebuild immagini
#   .\start.ps1 -RefreshFrontendDeps   # ricrea il volume node_modules (usare
#                                      # dopo aver aggiunto/rimosso dipendenze
#                                      # in frontend/package.json — evita di
#                                      # usare node_modules cached nel volume)
#   .\start.ps1 -RefreshBackendDeps    # rebuild immagine backend (usare
#                                      # dopo aver aggiunto/rimosso dipendenze
#                                      # in backend/requirements.txt)
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Stop,
    [switch]$Clean,
    [switch]$Logs,
    [switch]$Rebuild,
    [switch]$RefreshFrontendDeps,
    [switch]$RefreshBackendDeps,
    [switch]$WithLlm
)

$ErrorActionPreference = "Stop"

function Assert-Docker {
    $null = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $?) {
        Write-Host "ERRORE: docker non trovato nel PATH." -ForegroundColor Red
        Write-Host "Installa Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        exit 1
    }
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRORE: il daemon Docker non è in esecuzione." -ForegroundColor Red
        Write-Host "Avvia Docker Desktop e riprova." -ForegroundColor Yellow
        exit 1
    }
}

Assert-Docker

$profileArgs = @()
if ($WithLlm) { $profileArgs = @("--profile", "llm") }

if ($Stop) {
    Write-Host "Fermo i container (mantengo i volumi)..." -ForegroundColor Cyan
    docker compose @profileArgs down
    return
}

if ($Clean) {
    Write-Host "AVVISO: sto per CANCELLARE i volumi (DB, uploads, ollama)." -ForegroundColor Yellow
    $conf = Read-Host "Digita 'yes' per confermare"
    if ($conf -ne "yes") { Write-Host "Annullato." -ForegroundColor Gray; return }
    docker compose @profileArgs down -v
    return
}

if ($Logs) {
    docker compose @profileArgs logs -f
    return
}

if ($RefreshFrontendDeps) {
    Write-Host "Refresh node_modules frontend (dopo cambio package.json)..." -ForegroundColor Cyan

    # I comandi di cleanup possono "fallire" legittimamente (container non
    # esistente, volume non esistente, ecc.). Li eseguiamo con
    # ErrorActionPreference rilassato per non stoppare lo script.
    # In Windows PowerShell 5.1 ogni output native su stderr diventa un
    # NativeCommandError — per evitarlo redirigiamo stderr su file null.
    $previousEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"

    Write-Host "  Stop + rimozione container frontend..." -ForegroundColor Gray
    docker compose @profileArgs stop frontend 2>$null | Out-Null
    docker compose @profileArgs rm -f frontend 2>$null | Out-Null

    Write-Host "  Rimozione volume node_modules..." -ForegroundColor Gray
    docker volume rm gsi-dev_frontend_node_modules 2>$null | Out-Null

    $ErrorActionPreference = $previousEAP

    Write-Host "  Rebuild immagine frontend (npm ci)..." -ForegroundColor Cyan
    docker compose @profileArgs build frontend

    Write-Host "  Avvio stack..." -ForegroundColor Cyan
    docker compose @profileArgs up -d

    Write-Host ""
    Write-Host "Fatto. Frontend ripartito con dipendenze aggiornate su http://localhost:5173" -ForegroundColor Green
    Write-Host "Tip: 'docker compose logs -f frontend' per vedere i log di Vite." -ForegroundColor Gray
    return
}

if ($RefreshBackendDeps) {
    Write-Host "Rebuild immagine backend (dopo cambio requirements.txt)..." -ForegroundColor Cyan

    $previousEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    Write-Host "  Stop container backend..." -ForegroundColor Gray
    docker compose @profileArgs stop backend 2>$null | Out-Null
    $ErrorActionPreference = $previousEAP

    Write-Host "  Rebuild immagine backend (pip install)..." -ForegroundColor Cyan
    docker compose @profileArgs build backend

    Write-Host "  Avvio stack..." -ForegroundColor Cyan
    docker compose @profileArgs up -d

    Write-Host ""
    Write-Host "Fatto. Backend ripartito con dipendenze aggiornate su http://localhost:8000" -ForegroundColor Green
    Write-Host "Tip: 'docker compose logs -f backend' per vedere i log di uvicorn." -ForegroundColor Gray
    return
}

$buildFlag = if ($Rebuild) { "--build" } else { "" }

Write-Host "Avvio stack GSI..." -ForegroundColor Green
docker compose @profileArgs up -d $buildFlag

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  GSI in esecuzione" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Backend  : http://localhost:8000/docs"
Write-Host "  Frontend : http://localhost:5173"
Write-Host ""
Write-Host "  Login    : admin@gsi.local"
Write-Host "  Password : devpassword1234  (DEV ONLY, ignorato in prod)"
Write-Host ""
Write-Host "  Log completi : .\start.ps1 -Logs"
Write-Host "  Solo backend : docker compose logs -f backend"
Write-Host "  Stop         : .\start.ps1 -Stop"
Write-Host "  Reset DB     : .\start.ps1 -Clean"
Write-Host "================================================================" -ForegroundColor Green
