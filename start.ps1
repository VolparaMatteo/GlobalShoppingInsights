# ============================================================================
# GSI — start script (Windows PowerShell)
# Avvia l'intero stack tramite Docker Compose.
#
# Uso:
#   .\start.ps1              # avvia tutto (postgres + backend + frontend)
#   .\start.ps1 -WithLlm     # + servizio ollama (LLM second-opinion)
#   .\start.ps1 -Stop        # ferma i container (mantiene i volumi)
#   .\start.ps1 -Clean       # ferma e cancella VOLUMI (DB + uploads + ollama)
#   .\start.ps1 -Logs        # segue i log di tutti i servizi
#   .\start.ps1 -Rebuild     # forza rebuild immagini
# ============================================================================

[CmdletBinding()]
param(
    [switch]$Stop,
    [switch]$Clean,
    [switch]$Logs,
    [switch]$Rebuild,
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
