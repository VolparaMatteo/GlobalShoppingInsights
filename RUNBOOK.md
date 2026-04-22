# GSI — Runbook operativo

Guida pratica per chi amministra GSI in produzione sul VPS del cliente.
Chi legge questo documento **non** sviluppa GSI: lo deploya, lo monitora,
ripristina backup e applica aggiornamenti.

---

## 1. Architettura di deploy

```
                    Internet
                       │
                       ▼
                 ┌───────────┐
                 │  Traefik  │  80 / 443  (Let's Encrypt)
                 └─────┬─────┘
                       │
          ┌────────────┴────────────┐
          │       Frontend (Nginx)  │  SPA + proxy /api → backend
          └────────────┬────────────┘
                       │ (network: gsi-internal)
          ┌────────────┴────────────┐
          │    Backend (FastAPI)    │  gunicorn + UvicornWorker
          └────────────┬────────────┘
                       │
                 ┌─────┴─────┐
                 │ Postgres  │  volume: gsi_postgres_data
                 └───────────┘

         (opzionale, profile llm)
                 ┌───────────┐
                 │  Ollama   │  LLM second-opinion
                 └───────────┘
```

Sul VPS NON sono esposte porte applicative (Postgres, Backend, Ollama): solo
80 e 443 via Traefik. Il tutto gira in Docker Compose (`docker-compose.prod.yml`).

---

## 2. Prima installazione sul VPS

### 2.1 Requisiti VPS minimi
- Linux (Ubuntu 22.04 LTS consigliato)
- 2 vCPU, 4 GB RAM, 40 GB disco (8 GB RAM se si abilita Ollama)
- Docker Engine ≥ 24 + docker compose plugin
- DNS: record A/AAAA di `gsi.<cliente>.tld` che punta all'IP del VPS
- Firewall: `22` (SSH), `80`, `443` aperti

### 2.2 Installazione passo-passo
```bash
# Utente dedicato (opzionale ma raccomandato)
sudo adduser --system --group --home /opt/gsi gsi
sudo usermod -aG docker gsi
sudo su - gsi

cd /opt/gsi
git clone https://github.com/<org>/GlobalShoppingInsights.git app
cd app

# Configurazione segreta
cp .env.prod.example .env.prod
chmod 600 .env.prod
nano .env.prod                    # compila i campi OBBLIGATORIO
# Genera i segreti:
python3 -c "import secrets; print(secrets.token_urlsafe(64))"   # SECRET_KEY
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # WP_ENCRYPTION_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(18))"   # ADMIN_PASSWORD, POSTGRES_PASSWORD

# Deploy iniziale
./deploy.sh
```

Al primo avvio Traefik chiede il certificato a Let's Encrypt (challenge HTTP-01).
Attendi 30-60 secondi poi visita `https://gsi.<cliente>.tld` — deve apparire la
login di GSI.

### 2.3 Systemd wrapper (opzionale, consigliato)

Per far ripartire GSI dopo un reboot del VPS:

```ini
# /etc/systemd/system/gsi.service
[Unit]
Description=GSI Docker Compose stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=gsi
WorkingDirectory=/opt/gsi/app
ExecStart=/usr/bin/docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose --env-file .env.prod -f docker-compose.prod.yml down

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gsi.service
```

---

## 3. Deploy di un aggiornamento

```bash
cd /opt/gsi/app
./deploy.sh
```

Che cosa fa:
1. `git pull --ff-only`
2. Build immagini aggiornate
3. `docker compose up -d` (ricrea solo i container modificati)
4. Entrypoint backend: `alembic upgrade head` + `python seed.py` (idempotenti)
5. Attende che il container backend sia `healthy`
6. Smoke test end-to-end su `/api/v1/health`

Se il passo 5 o 6 fallisce, lo script **non** procede oltre ed esce con
istruzioni per il rollback.

### 3.1 Deploy di test locale (senza pull)
```bash
./deploy.sh --no-pull
```
Utile quando hai già fatto modifiche locali (es. `.env.prod`) e vuoi
rebuildare senza toccare git.

---

## 4. Rollback

### 4.1 Rollback rapido a un commit precedente
```bash
# Trova il commit a cui tornare (es. ultimi 5)
git log --oneline -5

./deploy.sh --rollback <sha>
```

Questo fa `git reset --hard <sha>` e poi un deploy completo.

### 4.2 Rollback migrazione DB (raro)
Se l'aggiornamento ha applicato una migrazione Alembic che rompe l'app:

```bash
# 1. Restore DB da backup più recente (vedi §5.2)
./scripts/restore.sh /var/backups/gsi/<file>.sql.gz

# 2. Rollback codice
./deploy.sh --rollback <sha>
```

**Attenzione**: `alembic downgrade -1` sulle migration di GSI **non è
garantito** funzioni sempre (può richiedere migration down scritte a mano
per alcune modifiche). In caso di dubbio usare il restore da backup.

---

## 5. Backup e restore

### 5.1 Backup manuale one-shot
```bash
cd /opt/gsi/app
PG_USER=gsi_user PG_DATABASE=gsi ./scripts/backup.sh
# Output in /var/backups/gsi/gsi_YYYYMMDD_HHMMSS.sql.gz
```

### 5.2 Backup automatico quotidiano (cron)
```bash
sudo crontab -e
# Aggiungi:
0 3 * * * /opt/gsi/app/scripts/backup.sh >> /var/log/gsi-backup.log 2>&1
```
Retention di default: 30 giorni (configurabile con `RETENTION_DAYS=60` nell'env
del cron).

### 5.3 Restore da un backup specifico
```bash
./scripts/restore.sh /var/backups/gsi/gsi_20260420_030000.sql.gz
# Chiede conferma interattiva ('yes'). Droppa e ricrea il DB.
```

### 5.4 Backup dei file di upload
Le immagini caricate vivono nel volume `gsi_backend_uploads`:
```bash
# Snapshot (tar dal mount point del volume)
docker run --rm -v gsi_backend_uploads:/data -v /var/backups/gsi:/backup alpine \
    tar -czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
```

---

## 6. Monitoraggio e health

### 6.1 Stato dei container
```bash
cd /opt/gsi/app
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Per ogni servizio la colonna STATUS mostra `Up (healthy)` quando tutto è OK.

### 6.2 Log in tempo reale
```bash
# Tutti i servizi
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f

# Solo backend (errori applicativi)
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend

# Solo Traefik (TLS, routing)
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f traefik
```

### 6.3 Health endpoint
```bash
# Dal VPS (via Traefik — richiede DNS valido e cert Let's Encrypt attivo)
curl https://gsi.<cliente>.tld/api/v1/health

# Dall'interno del container backend
docker compose -f docker-compose.prod.yml exec backend curl http://localhost:8000/api/v1/health
```

### 6.4 Audit log
Tutti i login, logout, modifiche utente e aggiornamenti WP-config sono loggati
nella tabella `audit_logs`. Accesso via API (admin-only):
```
GET https://gsi.<cliente>.tld/api/v1/audit-logs
```
Parametri: `?action=login&limit=50` / filtri per `entity`, `user_id`.

### 6.5 Uptime monitor esterno
Raccomandato: account gratuito su https://uptimerobot.com/ con check HTTPS
ogni 5 minuti su `https://gsi.<cliente>.tld/api/v1/health` + alert email al
team IT del cliente.

---

## 7. Rotazione chiavi / password

### 7.1 `SECRET_KEY` (JWT)
Cambiarla **invalida tutti i token attivi** (utenti costretti a rifare login).

```bash
# Genera
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Aggiorna .env.prod
nano .env.prod   # sostituisci SECRET_KEY=...

# Applica
./deploy.sh --no-pull
```

### 7.2 `WP_ENCRYPTION_KEY` (Fernet)
**⚠ CRITICO**: cambiarla **rende indecifrabili le password WP già salvate**.
Procedura sicura:

1. Nell'interfaccia admin, sezione *Impostazioni → WordPress*, prendi nota
   della password app di WP (o generala nuova su WP).
2. Genera la nuova chiave:
   ```bash
   python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```
3. Aggiorna `.env.prod` con la nuova `WP_ENCRYPTION_KEY` e fai deploy.
4. Accedi come admin, *Impostazioni → WordPress*, re-inserisci la password
   app: verrà cifrata con la nuova chiave.

### 7.3 `ADMIN_PASSWORD`
Per cambiare la password dell'admin iniziale da UI:
*Utenti → [admin] → Cambia password*.

Per cambiarla via seed (caso di emergenza):
```bash
nano .env.prod   # nuovo ADMIN_PASSWORD
# Rimuovi l'admin user dal DB manualmente OPPURE elimina il suo record e rilancia seed:
docker compose -f docker-compose.prod.yml exec backend python seed.py
```

### 7.4 Password PostgreSQL
Richiede aggiornamento coordinato di `POSTGRES_PASSWORD` + `DATABASE_URL` in
`.env.prod` + riavvio. Farlo in finestra di manutenzione:
```bash
# 1. Cambia password nel DB (container running)
docker compose -f docker-compose.prod.yml exec postgres \
    psql -U gsi_user -d gsi -c "ALTER USER gsi_user PASSWORD 'nuova-password';"

# 2. Aggiorna POSTGRES_PASSWORD e DATABASE_URL in .env.prod con la stessa

# 3. Redeploy
./deploy.sh --no-pull
```

---

## 8. Aggiornamento modello Ollama (se `--profile llm` attivo)

```bash
# Lista modelli presenti
docker compose -f docker-compose.prod.yml --profile llm exec ollama ollama list

# Pull di una nuova versione
docker compose -f docker-compose.prod.yml --profile llm exec ollama ollama pull qwen2.5:3b

# Il modello è salvato nel volume gsi_ollama_data (persistente tra riavvii).
```

---

## 9. Troubleshooting

### 9.1 "Configurazione insicura — il server non si avvierà"
Il backend non parte perché `.env.prod` ha ancora un valore di default per
`SECRET_KEY`, `WP_ENCRYPTION_KEY`, `ADMIN_PASSWORD`, o CORS_ORIGINS contiene
`localhost`. Correggi `.env.prod` e rilancia `./deploy.sh --no-pull`.

### 9.2 Traefik non ottiene il certificato Let's Encrypt
- Verifica che il DNS del dominio punti all'IP del VPS: `dig gsi.cliente.tld`
- Verifica che la porta 80 sia aperta e raggiungibile dall'esterno
- Controlla i log: `docker compose -f docker-compose.prod.yml logs traefik | grep -i acme`
- Let's Encrypt limita a **5 richieste/settimana** per dominio: se hai sbagliato
  config più volte, aspetta o usa lo staging server (richiede flag Traefik).

### 9.3 Backend non diventa `healthy`
```bash
docker compose -f docker-compose.prod.yml logs --tail=200 backend
```
Cause comuni:
- Postgres non ancora pronto (attendi, o riavvia `postgres`)
- Migrazione Alembic fallita → leggi lo stacktrace
- Sentence-transformers scarica il modello al primo uso (~90 MB): al primo
  avvio il container impiega 60-120s. Il volume `gsi_hf_cache` lo persiste
  per i successivi.

### 9.4 DB "out of disk space"
```bash
# Vedi quanto occupa il volume
docker system df -v | grep gsi_postgres_data
# Pulisci immagini dangling
docker system prune -f
# Se serve, rilancia un backup + vacuum
docker compose -f docker-compose.prod.yml exec postgres \
    psql -U gsi_user -d gsi -c "VACUUM FULL;"
```

### 9.5 "Pubblicazione WordPress fallita"
- Verifica in *Impostazioni → WordPress* che URL e credenziali siano giuste
- Il campo password è una **Application Password** WP (non la password utente)
- Test manuale: `curl -u user:app-password https://<wp>/wp-json/wp/v2/users/me`
- Controllare `job_logs` e `publish-jobs` via API

### 9.6 Ollama "out of memory"
Il modello Qwen 2.5 3B richiede ~4 GB RAM. Se il VPS ne ha 4 GB totali, non
c'è margine per il resto. Opzioni:
- Disabilita Ollama (`.\docker compose` senza `--profile llm`): la pipeline usa
  solo sentence-transformers (embeddings), niente second-opinion.
- Upgrade VPS ad almeno 8 GB.

### 9.7 Porta 80/443 già occupata
Probabilmente c'è un altro web server (nginx, apache) sull'host. Disabilitalo:
```bash
sudo systemctl disable --now nginx
sudo systemctl disable --now apache2
```
Oppure cambia porta in `docker-compose.prod.yml` (ma Let's Encrypt richiede 80).

---

## 10. Firewall VPS (raccomandato)

Con UFW (Ubuntu):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (redirect a HTTPS)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status verbose
```

Postgres, Backend, Ollama NON devono essere accessibili dall'esterno: restano
solo sulla docker network `gsi-internal`.

---

## 11. Contatti e supporto

- **Repository codice**: `https://github.com/<org>/GlobalShoppingInsights`
- **Issue tracker**: GitHub Issues (label `bug` / `ops`)
- **Documentazione tecnica**: `CLAUDE.md` (sviluppo) + `PIANO_CONSEGNA.md` (roadmap)
- **Supporto vendor**: _[da definire nel contratto di manutenzione]_
