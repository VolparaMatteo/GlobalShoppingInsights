# GSI — Manuale amministratore

Guida per chi amministra GSI **come prodotto**: gestione utenti, configurazione
WordPress, tassonomia, calendario, audit. Chi legge questo manuale ha un
account con ruolo **Amministratore** sulla piattaforma.

> Questa guida **non copre** l'amministrazione di sistema (deploy, backup del
> DB, rotazione chiavi Fernet/SECRET_KEY, firewall): per quelle operazioni vedi
> `RUNBOOK.md`.
>
> Per il flusso di lavoro quotidiano (creare prompt, approvare articoli,
> pianificare) vedi `USER_GUIDE.md`.

---

## Indice

1. [A chi è rivolto](#1-a-chi-è-rivolto)
2. [Primo accesso admin](#2-primo-accesso-admin)
3. [Gestione utenti e ruoli](#3-gestione-utenti-e-ruoli)
4. [Configurazione WordPress](#4-configurazione-wordpress)
5. [Tassonomia (tag e categorie)](#5-tassonomia-tag-e-categorie)
6. [Blacklist domini](#6-blacklist-domini)
7. [Regole del calendario editoriale](#7-regole-del-calendario-editoriale)
8. [Audit log](#8-audit-log)
9. [Scheduler e job in background](#9-scheduler-e-job-in-background)
10. [Gestione prompt in scala](#10-gestione-prompt-in-scala)
11. [Troubleshooting lato utente](#11-troubleshooting-lato-utente)
12. [Rimandi a RUNBOOK.md](#12-rimandi-a-runbookmd)

---

## 1. A chi è rivolto

Questo manuale è per **un utente con ruolo Amministratore** della piattaforma
GSI. Fornisce le procedure per governare il prodotto:

- Aggiungere/rimuovere utenti della redazione
- Configurare il collegamento con WordPress
- Mantenere pulita la tassonomia e la blacklist
- Leggere e analizzare gli audit log
- Intervenire quando un utente ha un problema

Il profilo amministratore **non richiede competenze di sistema**. Le operazioni
di server (backup, aggiornamento GSI, rotazione chiavi crittografiche) sono di
competenza dell'IT del cliente e sono descritte nel `RUNBOOK.md`.

---

## 2. Primo accesso admin

### 2.1 Credenziali iniziali

Al termine dell'installazione sul VPS, l'IT del cliente comunicherà:
- L'**URL** della piattaforma (es. `https://gsi.cliente.example`)
- L'**email** dell'amministratore iniziale (quella impostata in `ADMIN_EMAIL`)
- La **password iniziale** dell'amministratore

**Attenzione**: se nell'installazione è stato lasciato il valore di default
per `ADMIN_PASSWORD`, la piattaforma ha generato una password casuale al primo
avvio e l'ha stampata **una sola volta** nei log del container backend.
Recuperatela da lì prima del primo login.

### 2.2 Cosa fare immediatamente dopo il primo login

1. **Cambia subito la password** — menu utente → "Il mio profilo" → Cambia
   password. Scegli una password robusta: ≥16 caratteri, no termini comuni.
2. **Crea almeno un utente editor/revisore reale** — non usare l'account admin
   per il lavoro quotidiano.
3. **Configura WordPress** (sezione 4)
4. **Verifica audit log** (sezione 8): devi vedere il login appena fatto.

---

## 3. Gestione utenti e ruoli

Sezione **Impostazioni → Utenti** (visibile solo agli Amministratori).

[Schermata: tabella utenti con colonne email/nome/ruolo/stato attivo]

### 3.1 Creare un utente

Pulsante **+ Nuovo utente**:

- **Email** — univoca nel sistema
- **Nome** — visualizzato nell'UI (commenti, dashboard, audit)
- **Ruolo** — vedi tabella sotto
- **Password iniziale** — almeno 12 caratteri, non in blacklist

L'utente dovrà cambiarla al primo login. Comunicagliela in modo sicuro (NON
per email in chiaro, usa un password manager o un canale autenticato).

### 3.2 I cinque ruoli

| Ruolo | Livello | Cosa può fare | Cosa NON può fare |
|---|---|---|---|
| **Amministratore** | 5 | Tutto: utenti, settings, forzare stati, audit log, recupero scarti | — |
| **Revisore** | 4 | Approvare/rifiutare articoli, rimandarli a "Vagliato" | Gestire utenti, modificare WP config, forzare pubblicazioni |
| **Editore** | 3 | Modificare articoli, promuovere a "In revisione", gestire calendario, pianificare, pubblicare manualmente | Approvare articoli, gestire utenti, modificare WP config |
| **Collaboratore** | 2 | Creare prompt, eseguire ricerche, vagliare articoli dalla Inbox | Approvare, pianificare, pubblicare |
| **Solo lettura** | 1 | Visualizzare tutto (inbox, dashboard, calendario, audit) | Qualsiasi modifica |

### 3.3 Cambiare il ruolo di un utente

Dalla tabella utenti, click sulla riga → dropdown "Ruolo" → salva. Il
cambio è **loggato** nell'audit (`user.role_change`).

### 3.4 Disattivare un utente

In caso di uscita dal team o sospetto compromissione:

1. Pagina utente → toggle **"Attivo"** su OFF
2. L'utente non potrà più fare login
3. I suoi token JWT **non vengono revocati automaticamente**: se ha una
   sessione attiva in quel momento, rimane operativa fino a scadenza (max
   30 minuti access + 7 giorni refresh)
4. Per revoca immediata, vai in **Impostazioni → Sicurezza → Revoca sessioni
   utente** (se disponibile) oppure l'IT del cliente può forzare la rotazione
   di `SECRET_KEY` dal server (vedi `RUNBOOK.md §7.1`) — questo invalida
   *tutti* i token di *tutti* gli utenti.

### 3.5 Reset password di un utente

L'utente non ha un flusso self-service di "password dimenticata" (non ancora
implementato). Per resettarla:

1. Pagina utente → pulsante **"Reimposta password"**
2. Inserisci una password temporanea che rispetti la policy
3. Comunica la password all'utente in modo sicuro
4. L'utente è **costretto** a cambiarla al prossimo login

---

## 4. Configurazione WordPress

Sezione **Impostazioni → WordPress**.

[Schermata: form con URL WordPress, username, application password]

### 4.1 Cosa serve

Sul lato WordPress del cliente, serve:

1. Un **utente WP dedicato** (consigliato, non un account personale) con
   ruolo **Editor** o superiore
2. Una **Application Password** (NON la password normale dell'utente) generata
   dalla schermata profilo WordPress. È una stringa tipo `abcd efgh ijkl mnop`.

WordPress richiede HTTPS attivo per accettare Application Password.

### 4.2 Compilare il form

- **URL WordPress** — es. `https://redazione.cliente.example` (senza `/wp-json`
  alla fine, lo aggiunge GSI)
- **Username** — l'username WP dell'utente dedicato
- **Application Password** — incolla quella generata su WP

La password viene **cifrata con Fernet** prima di essere salvata nel database
GSI. L'API non la restituisce mai in chiaro, nemmeno all'admin.

### 4.3 Test connessione

Pulsante **"Testa connessione"**:

- GSI chiama `/wp-json/wp/v2/users/me` con le credenziali
- Se risponde 200 → OK, salva
- Se 401 → credenziali sbagliate
- Se 404 → URL sbagliato (manca `wp-json`? WP REST API disattivata?)
- Se timeout → WP offline o firewall

### 4.4 Rotazione della Application Password WP

Periodicamente (ogni 6-12 mesi) rigenera la Application Password dal pannello
WordPress per sicurezza. Poi:

1. Aggiorna il campo in Impostazioni → WordPress
2. Click "Testa connessione" → deve essere verde
3. Salva

Le pubblicazioni già avvenute non sono interessate.

---

## 5. Tassonomia (tag e categorie)

Sezione **Tassonomia**.

[Schermata: tab Tag + tab Categorie con vista ad albero]

### 5.1 Cosa fa

GSI mantiene una **copia locale** della tassonomia di WordPress (tag e
categorie). Ogni volta che un articolo viene pubblicato, GSI mappa i tag/
categorie locali a quelli remoti tramite il campo `wp_id`.

### 5.2 Sincronizzazione bidirezionale

Pulsante **"Sincronizza con WordPress"** (grande, in alto):

1. **Pull** — scarica tutti i tag e le categorie da WP (fino a 100 per pagina)
2. **Upsert locale** — se un tag/categoria esiste già (match su `wp_id` o
   `slug`) viene aggiornato; se no, viene creato
3. **Push** — i tag/categorie locali senza `wp_id` (creati in GSI ma non
   ancora su WP) vengono pushati
4. **Pulizia orfani** — tag/categorie locali con `wp_id` che non esistono più
   su WP vengono **rimossi** dal DB locale

La sincronizzazione è **lunga** (alcuni secondi/minuti se ci sono centinaia
di elementi). Fallo in un momento tranquillo.

### 5.3 Creare/modificare singoli elementi

Dal dettaglio tag/categoria:

- **Creazione**: crea prima localmente → GSI fa push a WP → salva `wp_id`
- **Modifica** (nome, slug): aggiorna localmente → push a WP
- **Eliminazione**: elimina da WP con `?force=true` → poi elimina localmente

Se lo push a WP fallisce durante una creazione, GSI fa **rollback locale**:
l'elemento non viene salvato. Questo evita che abbiate elementi "fantasma"
in GSI che non esistono su WP.

### 5.4 Categorie gerarchiche

Le categorie supportano una gerarchia padre/figlio. Usa la vista ad albero
per riordinare trascinando una categoria sotto un'altra.

### 5.5 Conflitti di slug

Se un tag importato da WP ha lo stesso `slug` di uno locale diverso, GSI
aggiunge `-wp` allo slug importato per risolvere il conflitto. Rivedi
manualmente questi casi dopo una sync grande.

---

## 6. Blacklist domini

Sezione **Impostazioni → Blacklist domini**.

### 6.1 A cosa serve

Impedisce che articoli da determinati domini finiscano mai in Inbox. Utile per:
- Siti noti di spam o contenuti non rilevanti
- Concorrenti del cliente (se non vuoi indicizzarli)
- Siti a paywall duro non monetizzabili

### 6.2 Aggiungere un dominio

Pulsante **+ Aggiungi dominio**:

- **Dominio** — nel formato `example.com` (no `https://`, no `www.`)
- **Motivo** — nota libera per ricordartelo dopo mesi

Il filtro agisce nella discovery pipeline: se durante la ricerca un URL
appartiene a un dominio bloccato, viene scartato **senza** scraping né
scoring AI.

### 6.3 Rimuovere un dominio

Dalla tabella, icona cestino sulla riga → conferma.

---

## 7. Regole del calendario editoriale

Sezione **Impostazioni → Regole calendario**.

### 7.1 Parametri modificabili

- **Massimo pubblicazioni per giorno** — default 10. Quando supera questo
  numero, il sistema blocca la creazione di nuovi slot in quel giorno (con
  un avviso, non un hard block).
- **Distanza minima tra pubblicazioni** — in ore, default 1. Due slot
  consecutivi non possono essere più vicini di questo intervallo.

### 7.2 Fascia oraria di pubblicazione

Per convenzione editoriale, il calendario mostra slot orari dalle **06:00
alle 22:00** (Europe/Rome). Questa fascia è hardcoded: se il cliente vuole
pubblicare fuori fascia, occorre una modifica di codice (parla con il
vendor).

---

## 8. Audit log

Sezione **Impostazioni → Audit log** (solo Amministratori).

[Schermata: tabella audit log con filtri action/entity/utente/data]

### 8.1 Cosa viene tracciato

| Azione | Quando |
|---|---|
| `login` | Login riuscito |
| `login.failed` | Credenziali sbagliate (anche su email sconosciute) |
| `login.deactivated` | Login con account disattivato |
| `logout` | Logout esplicito via UI |
| `user.create` | Creazione nuovo utente |
| `user.update` | Modifica nome/email |
| `user.password_change` | Cambio password (dall'utente stesso o reset admin) |
| `user.role_change` | Cambio di ruolo (chi, da quale ruolo, a quale) |
| `user.deactivate` | Disattivazione account |
| `wp_config.update` | Modifica URL o credenziali WordPress |

Ogni riga contiene: timestamp, user_id (chi ha fatto l'azione), action,
entity (oggetto interessato), entity_id, metadata (JSON libero con contesto).

### 8.2 Come consultare via UI

(Disponibile dopo Sprint 7, quando l'UI dedicata sarà pronta.)

Nel frattempo, interrogazione via API con un client HTTP:

```
GET https://gsi.cliente.example/api/v1/audit-logs?limit=50
Headers: Authorization: Bearer <token admin>
```

Parametri opzionali:
- `action=login.failed` → solo tentativi di login falliti
- `entity=user` → solo eventi su utenti
- `user_id=42` → tutte le azioni di un utente specifico
- `page=1&page_size=50` → paginazione

### 8.3 Cosa fare se vedi eventi sospetti

Molti `login.failed` ravvicinati per lo stesso account → possibile attacco:
contatta l'IT del cliente per considerare un blocco IP. GSI già applica
rate limit su `/auth/login` (5 tentativi/minuto).

`user.role_change` da Revisore ad Amministratore non pianificato → verifica
immediatamente chi l'ha fatto (campo user_id di chi ha eseguito l'azione).

---

## 9. Scheduler e job in background

Lo scheduler è **automatico e sempre attivo**. Non ha una UI dedicata, ma
puoi controllarne l'attività.

### 9.1 Cosa fa

- **Ogni 5 minuti**: controlla i prompt con schedulazione attiva e lancia
  quelli dovuti (`run_discovery_pipeline`).
- **Ogni 1 minuto**: controlla gli slot del calendario con `scheduled_for ≤
  now` e lancia la pubblicazione WordPress.

### 9.2 Visualizzare l'esito dei job

Dashboard → **Ultimi job** mostra le esecuzioni recenti con stato
(pending/running/completed/failed) e, per quelle fallite, il messaggio di
errore.

### 9.3 Disabilitare temporaneamente uno scheduler

Non c'è UI di disabilitazione globale. Per singoli prompt: dettaglio prompt
→ toggle **"Esecuzione automatica"** → OFF.

Per disabilitare la pubblicazione automatica di un intero giorno: entra nel
calendario, seleziona gli slot del giorno, menu → "Sposta indietro a
Approvato" (operazione batch).

---

## 10. Gestione prompt in scala

### 10.1 Organizzazione in cartelle

Con decine di prompt è fondamentale strutturarli. Crea cartelle per:
- Area geografica (Italia, UK, US)
- Vertical (E-commerce, Logistics, Sustainability)
- Campagna tematica (Black Friday 2026, Natale 2026)

Le cartelle sono gerarchiche: puoi avere `Italia → Black Friday 2026 →
Abbigliamento`.

### 10.2 Duplicazione e batch edit

(Funzionalità pianificata per Sprint 6+.) Nel frattempo, per creare varianti:
apri il prompt, modifica, salva con un titolo diverso.

### 10.3 Revisione periodica

Una volta al mese, controlla la **cronologia** dei prompt schedulati:

- Se un prompt ha 10 esecuzioni e 0 articoli creati → keyword troppo
  specifiche o troppo generiche, rivedile
- Se un prompt ha 10 esecuzioni e molti errori → forse il sito target è
  cambiato, aggiorna la descrizione

---

## 11. Troubleshooting lato utente

### 11.1 "Non riesco a fare login"

Controlla nell'audit (`login.failed`) se il tentativo arriva davvero. Se
no → problema di rete lato client. Se sì:

- Password sbagliata? Reset dall'admin (§3.5).
- Account disattivato? Riattivalo (§3.4).
- Rate limit? Dopo 5 tentativi falliti in 1 minuto l'endpoint risponde 429.
  L'utente aspetta 1 minuto e riprova.

### 11.2 "Non vedo il pulsante X"

Il pulsante è nascosto per ruolo insufficiente. Verifica il ruolo dell'utente
in Impostazioni → Utenti.

### 11.3 "Una pubblicazione è in 'In pubblicazione' da 10 minuti"

Possibile hang. Verifica:
- Dashboard → Ultimi job → c'è un'entry `publish_to_wordpress` pending?
- Chiedi all'IT di controllare i log del backend (`docker compose logs
  backend`)
- Ultima spiaggia: chiedi all'IT di riavviare il container backend. Lo
  slot torna in `publishing`; al riavvio lo scheduler lo rielabora.

### 11.4 "L'AI Score è sempre 0 o molto basso per tutti gli articoli"

Possibile: il modello `sentence-transformers` non è caricato. GSI allora
usa un fallback basato solo su keyword matching. L'IT deve verificare nei
log backend se al primo avvio il download del modello (~90 MB) è riuscito.
Il volume Docker `gsi_hf_cache` lo persiste.

### 11.5 "La pipeline non trova articoli anche cambiando keyword"

Verifica:
- Il dominio target non è nella blacklist (§6)
- La `time_depth` del prompt non è troppo stretta (es. 24h in un giorno
  con pochi articoli)
- DuckDuckGo non stia bloccando l'IP del VPS (succede se si fanno troppe
  query al minuto — il rate limit interno mitiga questo).

---

## 12. Rimandi a RUNBOOK.md

Operazioni di sistema che richiedono accesso SSH al VPS e che l'IT del
cliente gestisce:

| Operazione | Sezione RUNBOOK |
|---|---|
| Aggiornare GSI a una nuova versione | §3 Deploy |
| Rollback a una versione precedente | §4 Rollback |
| Backup manuale del DB | §5.1 |
| Backup automatico quotidiano (cron) | §5.2 |
| Restore da backup | §5.3 |
| Ruotare `SECRET_KEY` (JWT) | §7.1 |
| Ruotare `WP_ENCRYPTION_KEY` (Fernet) — critico | §7.2 |
| Ruotare password PostgreSQL | §7.4 |
| Aggiornare il modello Ollama | §8 |
| Troubleshooting TLS / backend unhealthy / disco pieno | §9 |
| Configurare firewall UFW sul VPS | §10 |

---

*Versione del manuale: 1.0 (preparazione consegna, 2026-04-22). Screenshot
dopo Sprint 7 (design system).*
