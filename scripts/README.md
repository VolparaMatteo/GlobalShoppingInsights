# scripts/ — operatività sul VPS

Script operativi che NON fanno parte del codice applicativo. Da installare sul
server di produzione, tipicamente in `/opt/gsi/scripts/`.

## backup.sh

Backup giornaliero PostgreSQL con retention configurabile.

```bash
# One-shot
PG_USER=gsi_user PG_DATABASE=gsi ./backup.sh

# Cron (come utente `gsi` o `root`)
0 3 * * * /opt/gsi/scripts/backup.sh >> /var/log/gsi-backup.log 2>&1
```

Variabili:

| Variabile | Default | Note |
|---|---|---|
| `PG_HOST` | `localhost` | |
| `PG_PORT` | `5432` | |
| `PG_USER` | `gsi_user` | |
| `PG_DATABASE` | `gsi` | |
| `PG_PASSWORD` | (empty) | Meglio `~/.pgpass` con mode 600 |
| `BACKUP_DIR` | `/var/backups/gsi` | Creata se non esiste |
| `RETENTION_DAYS` | `30` | File più vecchi vengono eliminati |

Output: `gsi_YYYYMMDD_HHMMSS.sql.gz` nel `BACKUP_DIR`.

## restore.sh

Restore **distruttivo** (drop + create) di un dump prodotto da `backup.sh`.

```bash
PG_USER=gsi_user PG_DATABASE=gsi ./restore.sh /var/backups/gsi/gsi_20260420_030000.sql.gz
```

Chiede conferma interattiva (`yes`). Usa `--set ON_ERROR_STOP=1` per fail-fast.

Se il dump è pre-Alembic (schema gestito da `create_all`), esegui subito dopo:
```bash
alembic stamp head
# oppure, se il dump include già tabelle e alembic_version:
alembic upgrade head
```

## Roadmap operativa

- Sprint 5: `deploy.sh` (git pull + build image + migrate + restart blue-green + smoke test)
- Sprint 5: systemd unit per backup (`gsi-backup.service` + `gsi-backup.timer`)
- Sprint 8: `RUNBOOK.md` completo (restart, rollback, log, aggiornamento Ollama)
