# GSI — Manuale utente

Guida pratica per chi usa Global Shopping Insights tutti i giorni: editor,
reviewer, contributor e amministratori nel loro ruolo quotidiano.

> Questa guida copre il flusso operativo. Per l'installazione del server
> e le operazioni di sistema vedi `RUNBOOK.md`. Per la gestione utenti
> e delle configurazioni vedi `ADMIN_GUIDE.md`.

---

## Indice

1. [Primo accesso](#1-primo-accesso)
2. [Panoramica dell'interfaccia](#2-panoramica-dellinterfaccia)
3. [Dashboard](#3-dashboard)
4. [Prompt di ricerca](#4-prompt-di-ricerca)
5. [Inbox — gli articoli scoperti](#5-inbox--gli-articoli-scoperti)
6. [Dettaglio articolo](#6-dettaglio-articolo)
7. [Il workflow editoriale](#7-il-workflow-editoriale)
8. [Calendario editoriale](#8-calendario-editoriale)
9. [Pubblicazione su WordPress](#9-pubblicazione-su-wordpress)
10. [Notifiche e commenti](#10-notifiche-e-commenti)
11. [Il mio profilo](#11-il-mio-profilo)
12. [Domande frequenti](#12-domande-frequenti)

---

## 1. Primo accesso

### 1.1 Accedere alla piattaforma

Apri il browser e visita l'indirizzo che ti ha comunicato l'amministratore
(es. `https://gsi.cliente.example`). Vedrai la schermata di login.

[Schermata: pagina di login con campi Email e Password]

Inserisci:
- **Email** — quella che ti è stata assegnata
- **Password** — quella ricevuta dall'amministratore al momento della creazione
  del tuo account

Al primo accesso ti sarà chiesto di **cambiare la password**. Scegli una
password che rispetta la policy della piattaforma:
- minimo 12 caratteri
- niente password troppo comuni (`admin123`, `password1234`, ecc.)

### 1.2 Ho dimenticato la password

Contatta il tuo amministratore. Ti resetterà la password dalla sezione
**Utenti** del pannello admin.

### 1.3 Sessione e logout

La sessione ha una durata limitata (30 minuti di inattività) e viene rinnovata
automaticamente mentre lavori. Quando fai logout tutti i token di accesso
vengono **revocati immediatamente**: nessuno può continuare a usare la
sessione nemmeno con i cookie salvati.

Per uscire: menu utente in alto a destra → **Esci**.

---

## 2. Panoramica dell'interfaccia

[Schermata: layout generale con sidebar sinistra e area contenuti]

L'interfaccia è divisa in tre zone:

- **Sidebar sinistra** — la navigazione principale tra le sezioni
- **Header in alto** — campanello notifiche, nome utente, logout
- **Area centrale** — il contenuto della sezione selezionata

### 2.1 Le sezioni

| Sezione | A cosa serve |
|---|---|
| Dashboard | Visione d'insieme: quanti articoli nuovi, in revisione, pubblicati questa settimana |
| Inbox | Lista di tutti gli articoli scoperti dalle ricerche, con filtri |
| Prompt | Le tue ricerche automatiche configurate |
| Calendario | Pianificazione editoriale con drag & drop |
| Tassonomia | Gestione dei tag e delle categorie (sincronizzati con WordPress) |
| Impostazioni | Solo admin: configurazione WordPress, blocklist domini, utenti |

### 2.2 Il tuo ruolo

In alto a destra, sotto il tuo nome, vedi il tuo ruolo. Determina cosa
puoi fare:

| Ruolo | Può fare |
|---|---|
| **Amministratore** | Tutto: gestione utenti, configurazione, forzare stati |
| **Revisore** | Approvare/rifiutare articoli, rimandarli indietro |
| **Editore** | Modificare articoli, gestire calendario, pubblicare |
| **Collaboratore** | Creare prompt, eseguire ricerche, screening base |
| **Solo lettura** | Visualizzare tutto, nessuna modifica |

Se un pulsante non è cliccabile, è perché il tuo ruolo non ti autorizza
quell'azione.

---

## 3. Dashboard

La dashboard è il punto di partenza di ogni giornata.

[Schermata: dashboard con KPI card in griglia e ultimi job in basso]

Trovi:
- **6 card KPI** — totale articoli, nuovi nella settimana, in revisione,
  pianificati, pubblicati, punteggio AI medio
- **Pipeline overview** — visualizza quanti articoli sono in ogni stato
- **Ultimi job** — cronologia recente di ricerche e pubblicazioni, con esito
- **Alert** — eventuali errori che richiedono la tua attenzione (es.
  pubblicazione WordPress fallita)

Clicca su una qualsiasi KPI card per aprire l'Inbox già filtrata su
quell'insieme (es. cliccando "In revisione" vai direttamente alla lista
degli articoli in quello stato).

---

## 4. Prompt di ricerca

Un **prompt** è una ricerca salvata: definisce quali articoli GSI deve
cercare per te sul web, con quali filtri e con quale frequenza.

### 4.1 Organizzazione in cartelle

I prompt possono essere raggruppati in cartelle gerarchiche (es. "Italia",
"UK", "Black Friday 2026"). Crea le cartelle dalla sidebar sinistra della
pagina Prompt con il pulsante "+ Nuova cartella".

### 4.2 Creare un prompt

[Schermata: form di creazione prompt con i campi principali]

Pulsante **+ Nuovo prompt** → form:

- **Titolo** — nome identificativo (es. "E-commerce Italia Q2 2026")
- **Descrizione** — la query vera e propria di ricerca in linguaggio naturale.
  Se lasciata vuota, GSI userà le keyword qui sotto come query.
- **Keywords** — parole chiave da cercare (es. `["e-commerce", "retail"]`)
- **Keywords escluse** — termini da scartare (es. `["crypto", "bitcoin"]`)
- **Lingua** — codice ISO (`it`, `en`, `fr`, ...); vuoto = qualsiasi
- **Paesi target** — lista di codici (`IT`, `US`, `UK`, `FR`, ...)
- **Profondità temporale** — da quanti giorni indietro cercare: 24 ore, 7
  giorni, 30 giorni, 90 giorni
- **Numero massimo risultati** — quanti articoli tentare di raccogliere per
  ogni esecuzione (default 20)

### 4.3 Programmare l'esecuzione automatica

Nel form prompt, sezione **Schedulazione**:

- **Abilita esecuzione automatica** (toggle)
- **Frequenza in ore** — ogni quante ore (es. 12 = due volte al giorno)
- **Orari specifici** — alternativa: lista di orari fissi (`09:00`, `18:00`)

Lo scheduler interno controlla ogni 5 minuti se ci sono prompt da eseguire.

### 4.4 Eseguire una ricerca manuale

Dalla lista prompt o dal dettaglio prompt, clicca **"Esegui ora"**. GSI:

1. Esegue la ricerca su DuckDuckGo con i parametri del prompt
2. Per ogni risultato fa lo scraping del contenuto
3. Calcola il punteggio AI di rilevanza (0–100)
4. Elimina duplicati (stesso URL o stesso contenuto)
5. Salva gli articoli nell'Inbox con stato **"Importato"**

L'operazione è asincrona: continua a lavorare, una notifica ti avviserà
quando la ricerca è completata.

### 4.5 Cronologia esecuzioni

Nel dettaglio di ogni prompt c'è la tab **"Cronologia"** con tutte le
esecuzioni precedenti: data, numero risultati trovati, numero articoli
effettivamente creati (dopo deduplicazione), eventuali errori.

---

## 5. Inbox — gli articoli scoperti

L'Inbox è la tabella principale dove vivono tutti gli articoli. Da qui li
vedi, filtri, promuovi o scarti.

[Schermata: tabella Inbox con colonne titolo/score/stato/data e filtri]

### 5.1 Colonne

- **Titolo** — clicca per aprire il dettaglio
- **Dominio di origine** — da quale sito è stato scaricato
- **Lingua** — codice rilevato automaticamente
- **Punteggio AI** — 0-100, colorato: verde ≥75, arancione ≥50, rosso <50
- **Stato** — corrente nel workflow (vedi §7)
- **Data articolo** — data di pubblicazione originale
- **Prompt** — quale prompt l'ha scoperto

### 5.2 Filtri

Pulsante **Filtri**:

- **Ricerca testuale** — cerca nel titolo e nel contenuto (con un piccolo
  ritardo per non appesantire)
- **Stato** — multi-selezione
- **Lingua** — codice ISO
- **Punteggio AI** — slider a due manopole per range
- **Dominio** — filtra per sito di origine
- **Paese** — paese rilevato
- **Prompt di origine** — tutti o uno specifico

I filtri sono combinabili e salvati nell'URL: puoi condividere un link a
una vista filtrata con un collega.

### 5.3 Azioni rapide (preview drawer)

Clicca su un articolo nella tabella: si apre un drawer laterale con
anteprima rapida. Da lì puoi:

- Leggere il contenuto senza uscire dall'Inbox
- Cambiare stato (Vaglia, Scarta) con un click
- Aprire il dettaglio completo per modifiche approfondite

### 5.4 Operazioni batch

Seleziona più articoli con le checkbox nella prima colonna, poi usa la
barra azioni in fondo:

- **Cambia stato** — per tutti gli articoli selezionati
- **Aggiungi tag** — assegna uno o più tag a tutti
- **Scarta** — elimina i selezionati (richiede conferma)

---

## 6. Dettaglio articolo

Clicca sul titolo di un articolo nell'Inbox. Si apre la pagina di dettaglio
a due colonne.

[Schermata: dettaglio articolo, colonna sinistra contenuto/colonna destra metadati]

### 6.1 Colonna sinistra — il contenuto

- Titolo modificabile (icona matita)
- Contenuto dell'articolo: testo + immagini
- **Editor inline** per ritoccare il testo prima della pubblicazione
- Thread commenti in fondo

Ogni volta che salvi una modifica, viene creata una **revisione** (storia
completa accessibile dalla tab "Revisioni").

### 6.2 Colonna destra — metadati e AI

- **Pannello AI Score**: indicatore circolare colorato + spiegazione dei
  punti (es. "Matched 4/6 keywords", "Semantic similarity: 0.52")
- **Metadati**: autore, data di pubblicazione, lingua, paese, dominio,
  URL originale (cliccabile)
- **Immagine di copertina**: sostituibile con upload locale o URL esterno
- **Tag assegnati** — dropdown con ricerca; i tag suggeriti dall'AI sono
  evidenziati
- **Categorie assegnate** — stessa logica; l'AI suggerisce la categoria più
  probabile
- **Prompt di origine** — link al prompt che ha scoperto questo articolo

### 6.3 Thread commenti

Sotto il contenuto c'è uno spazio per commenti tra il team. Scrivi,
menziona un collega con `@nome`: riceverà una notifica.

### 6.4 Pulsanti azione in alto a destra

I pulsanti disponibili dipendono dallo stato corrente dell'articolo e dal
tuo ruolo. Esempi:

- Stato "Importato" + ruolo Collaboratore → puoi **Vagliare** o **Scartare**
- Stato "Vagliato" + ruolo Editore → puoi mandarlo **In Revisione**
- Stato "In revisione" + ruolo Revisore → puoi **Approvare** o **Rifiutare**
- Stato "Approvato" + ruolo Editore/Revisore → puoi **Pianificare**
  (apre il modale per scegliere data/ora)

Se un pulsante non compare, non hai i permessi per quella transizione.

---

## 7. Il workflow editoriale

Ogni articolo ha uno **stato** che indica in quale punto del flusso si trova.

```
 [Importato] ──► [Vagliato] ──► [In revisione] ──► [Approvato] ──► [Pianificato] ──► [In pubblicazione] ──► [Pubblicato]
      │                                │                                                       │
      └──► [Scartato]  ◄────────────────┘                                                      └──► [Pubblicazione fallita] ──► ritorna a [Pianificato] (riprova)
```

### 7.1 Chi può fare cosa

| Transizione | Chi la può eseguire |
|---|---|
| Importato → Vagliato | Collaboratore, Editore, Revisore, Admin |
| Importato → Scartato | Editore, Revisore, Admin |
| Vagliato → In revisione | Editore, Admin |
| Vagliato → Scartato | Editore, Revisore, Admin |
| In revisione → Approvato | Revisore, Admin |
| In revisione → Scartato | Revisore, Admin |
| In revisione → Vagliato | Revisore, Admin (rimanda indietro) |
| Approvato → Pianificato | Editore, Revisore, Admin |
| Pianificato → Approvato | Editore, Revisore, Admin (annulla pianificazione) |
| Pianificato → In pubblicazione | Admin (forza) |
| Pubblicazione fallita → Pianificato | Editore, Revisore, Admin (riprova) |
| Scartato → Importato | Admin (recupera articolo scartato) |

Il pulsante **"Transizioni disponibili"** nel dettaglio articolo ti mostra
sempre solo quelle abilitate per il tuo ruolo.

### 7.2 Articoli scartati

Gli articoli in stato "Scartato" non vengono cancellati: restano visibili
nell'Inbox con il filtro stato. Solo l'admin può riportarli a "Importato"
se sono stati scartati per errore.

---

## 8. Calendario editoriale

[Schermata: calendario mese con slot colorati e sidebar articoli pronti]

### 8.1 Viste disponibili

- **Mese** — griglia 6 settimane, con conteggio slot per giorno
- **Settimana** — 7 colonne dettagliate
- **Giorno** — slot orari dalle 06:00 alle 22:00

Cambia vista con i pulsanti in alto a destra.

### 8.2 Pianificare un articolo

Due modi:

**Drag & drop** (metodo rapido)

1. Nella sidebar sinistra vedi gli articoli approvati pronti per la
   pianificazione
2. Trascina un articolo sulla data/ora desiderata nel calendario
3. Si apre il modale per confermare data/ora esatta
4. Conferma → l'articolo passa in stato "Pianificato"

**Dal dettaglio articolo**

1. Apri l'articolo (stato "Approvato")
2. Pulsante **Pianifica** → modale con calendario
3. Seleziona data e ora
4. Conferma

### 8.3 Rilevamento collisioni

Prima di creare lo slot, GSI verifica:

- Numero massimo di pubblicazioni per giorno (configurabile in
  Impostazioni → Regole calendario, default 10)
- Distanza minima in ore tra due slot consecutivi

Se c'è un conflitto, appare un avviso: confermi comunque o cambi orario.

### 8.4 Modificare o eliminare uno slot

Clicca su uno slot nel calendario:

- **Modifica data/ora** — trascina lo slot su un'altra casella
- **Elimina slot** — menu contestuale → "Rimuovi dal calendario" (l'articolo
  torna in stato "Approvato")

### 8.5 Fuso orario

Tutti gli slot usano il fuso orario **Europe/Rome** come default. Le date
sono formattate in italiano (es. "Lun 22 Apr 2026").

---

## 9. Pubblicazione su WordPress

### 9.1 Cosa succede

Quando uno slot raggiunge la data/ora di pubblicazione:

1. Lo scheduler (ogni minuto) lo rileva
2. L'articolo passa in stato **"In pubblicazione"**
3. GSI contatta WordPress via API:
   - Carica l'immagine di copertina nella Media Library
   - Crea il post con titolo, contenuto, tag, categorie, immagine in evidenza
4. Se tutto va bene → stato **"Pubblicato"**, l'URL WP è visibile nel
   dettaglio articolo
5. Se qualcosa fallisce → stato **"Pubblicazione fallita"**

### 9.2 Pubblicazione manuale

Un utente con ruolo **Editore** o superiore può forzare la pubblicazione
immediata di un articolo approvato: dal dettaglio, pulsante **"Pubblica ora"**.

### 9.3 Pubblicazione fallita — cosa fare

Nel dettaglio dell'articolo, sezione **"Ultimo errore"**, trovi il messaggio
restituito da WordPress. Cause tipiche:

- Credenziali WordPress cambiate → chiedi all'admin di aggiornarle
- WordPress offline momentaneamente → aspetta 2-3 minuti
- Immagine troppo grande → sostituisci con una versione più leggera
- Categoria/tag non esistente più su WP → sincronizza la tassonomia

Pulsante **"Riprova pubblicazione"** per rilanciare.

### 9.4 Vedere i post pubblicati

Filtro stato = "Pubblicato" nell'Inbox, oppure la tab **"Pubblicati"** nella
dashboard. Ogni riga ha il link diretto al post su WordPress.

---

## 10. Notifiche e commenti

### 10.1 Notifiche (icona campanella)

Ricevi notifiche per eventi importanti:
- Un tuo articolo è stato approvato o rifiutato
- Una ricerca che hai lanciato è completata
- Una pubblicazione WordPress è riuscita o fallita
- Sei stato menzionato in un commento (`@tuonome`)

Click sulla notifica → ti porta direttamente all'articolo in questione.

Pulsanti in alto al pannello notifiche:
- **Segna come letta** (per una singola)
- **Segna tutte come lette**

### 10.2 Commenti su articolo

Nel dettaglio articolo, thread in fondo alla colonna sinistra.

- Scrivi un commento nel campo di testo
- Menziona un collega con `@` + inizio del nome → selezione da dropdown
- I commenti sono ordinati dal più vecchio al più recente
- Ogni commento mostra avatar, nome autore, timestamp relativo ("2 ore fa")

I commenti non sono modificabili dopo l'invio per tracciabilità.

---

## 11. Il mio profilo

Menu utente in alto a destra → **Il mio profilo**.

Da qui puoi:
- Cambiare la tua password (richiede la vecchia password per conferma)
- Aggiornare nome visualizzato
- Vedere il tuo ruolo (non modificabile da te — solo admin)

### Cambio password

1. Inserisci la password attuale
2. Inserisci la nuova (minimo 12 caratteri, non in blacklist)
3. Conferma ripetendola
4. **Salva** → sarai disconnesso e dovrai rifare login con la nuova

---

## 12. Domande frequenti

### Perché l'AI Score di un articolo è basso?

Il punteggio riflette quanto il contenuto dell'articolo è **semanticamente
vicino** alla descrizione del prompt che l'ha scoperto. Se il prompt è
generico, anche articoli buoni possono avere punteggio medio. Rivedi la
descrizione del prompt per renderla più specifica.

### Ho scartato un articolo per errore. Come lo recupero?

Solo un amministratore può riportare un articolo da "Scartato" a
"Importato". Contattalo indicando l'ID dell'articolo (visibile nell'URL
della pagina di dettaglio).

### Le modifiche che faccio al contenuto di un articolo vengono perse?

No. Ogni salvataggio crea una revisione tracciata. La tab **"Revisioni"**
nel dettaglio mostra tutte le versioni con autore e data; puoi confrontare
due versioni o ripristinarne una precedente.

### Un articolo pubblicato ha un errore. Posso modificarlo dopo la pubblicazione?

No, GSI non modifica post WordPress già pubblicati. Devi correggere
direttamente sul sito WordPress (o lì c'è il link al post nel dettaglio
articolo). GSI può solo pubblicare, non aggiornare.

### Posso esportare una lista di articoli?

Sì. Dall'Inbox, pulsante **Esporta** in alto a destra → scelta formato
CSV o JSON. L'export rispetta i filtri attivi.

### Perché il calendario non mi lascia pianificare oltre le 22?

La fascia di pianificazione è **06:00-22:00** per convenzione editoriale.
L'amministratore può modificarla in Impostazioni → Regole calendario se
servono pubblicazioni fuori orario.

### Quanto spesso le ricerche automatiche vengono eseguite?

Ogni prompt con schedulazione attiva viene controllato ogni **5 minuti**.
Se la sua prossima esecuzione è scaduta, GSI la lancia. Quindi un prompt
"ogni 6 ore" si allinea entro i 5 minuti successivi all'orario atteso.

### Chi può vedere i miei commenti?

Tutti gli utenti della piattaforma con almeno il ruolo **Solo lettura**.
Non sono commenti privati: usali solo per collaborazione editoriale.

### La pubblicazione su WordPress ha sbagliato tag/categoria. Come mai?

I tag e le categorie devono essere **sincronizzati** tra GSI e WordPress.
Chiedi all'admin di eseguire una sincronizzazione da Tassonomia →
**Sincronizza con WordPress**. Se il problema persiste, è possibile che
qualcuno abbia modificato il tag direttamente su WP senza passare da GSI.

---

*Versione del manuale: 1.0 (preparazione consegna, 2026-04-22). Gli
screenshot saranno inseriti dopo il refresh grafico (Sprint 7).*
