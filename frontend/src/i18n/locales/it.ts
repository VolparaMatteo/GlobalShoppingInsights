// ---------------------------------------------------------------------------
// i18n/locales/it.ts — lingua primaria (Italian)
//
// Convenzione: chiavi strutturate per feature (nav, inbox, article, ...),
// annotate in snake_case. Le stringhe dinamiche usano {{placeholder}}.
// ---------------------------------------------------------------------------

export default {
  common: {
    loading: 'Caricamento...',
    save: 'Salva',
    cancel: 'Annulla',
    confirm: 'Conferma',
    delete: 'Elimina',
    edit: 'Modifica',
    close: 'Chiudi',
    retry: 'Riprova',
    back: 'Indietro',
    next: 'Avanti',
    search: 'Cerca',
    filter: 'Filtra',
    clear: 'Pulisci',
    yes: 'Sì',
    no: 'No',
    all: 'Tutti',
    none: 'Nessuno',
    empty: 'Nessun dato disponibile',
  },

  nav: {
    dashboard: 'Dashboard',
    alerts: 'Alert & Job Log',
    prompts: 'Prompt',
    inbox: 'Posta in Arrivo',
    calendar: 'Calendario',
    taxonomy: 'Tassonomia',
    settings: 'Impostazioni',
    skipToContent: 'Vai al contenuto',
  },

  auth: {
    loginTitle: 'Accedi a GSI',
    email: 'Email',
    password: 'Password',
    submit: 'Accedi',
    logout: 'Esci',
    profile: 'Il mio profilo',
    changePassword: 'Cambia password',
    sessionExpired: 'Sessione scaduta. Effettua di nuovo il login.',
  },

  theme: {
    light: 'Tema chiaro',
    dark: 'Tema scuro',
    toggleLight: 'Passa a tema chiaro',
    toggleDark: 'Passa a tema scuro',
  },

  status: {
    imported: 'Importato',
    screened: 'Vagliato',
    in_review: 'In Revisione',
    approved: 'Approvato',
    scheduled: 'Pianificato',
    publishing: 'In Pubblicazione',
    published: 'Pubblicato',
    publish_failed: 'Pubblicazione Fallita',
    rejected: 'Rifiutato',
  },

  role: {
    admin: 'Amministratore',
    reviewer: 'Revisore',
    editor: 'Editore',
    contributor: 'Collaboratore',
    read_only: 'Sola Lettura',
  },

  dashboard: {
    greeting_morning: 'Buongiorno',
    greeting_afternoon: 'Buon pomeriggio',
    greeting_evening: 'Buonasera',
    subtitle: 'Ecco lo stato della tua pipeline editoriale oggi.',
    kpi: {
      total: 'Articoli Totali',
      new_week: 'Nuovi Settimana',
      in_review: 'In Revisione',
      scheduled: 'Pianificati',
      published: 'Pubblicati',
      ai_score: 'Punteggio AI Medio',
    },
    pipeline_title: 'Pipeline Editoriale',
    distribution_title: 'Distribuzione articoli nel workflow',
    distribution_subtitle: 'Numero di articoli per ogni stato della pipeline editoriale',
  },

  inbox: {
    title: 'Posta in Arrivo',
    searchPlaceholder: 'Cerca per titolo o contenuto...',
    filters: 'Filtri',
    batch: 'Operazioni batch',
    preview: 'Anteprima',
    empty: 'Nessun articolo trovato',
    emptyFiltered: 'Nessun articolo corrisponde ai filtri selezionati',
  },

  commandPalette: {
    placeholder: 'Cerca articoli, prompt, utenti, o azioni…',
    empty: 'Nessun risultato per "{{query}}"',
    navigate: 'Naviga',
    actions: 'Azioni rapide',
    articles: 'Articoli',
    prompts: 'Prompt',
  },

  errors: {
    generic: 'Si è verificato un errore. Riprova tra qualche istante.',
    network: 'Impossibile contattare il server. Controlla la connessione.',
    timeout: 'Timeout: il server non ha risposto in tempo.',
    forbidden: 'Non hai i permessi per eseguire questa azione.',
    notFound: 'Risorsa non trovata.',
    rateLimit: 'Troppe richieste ravvicinate. Aspetta qualche secondo.',
    server: "Errore del server. Se persiste, contatta l'amministratore.",
  },

  llm: {
    bannerTitle: 'LLM (Ollama) temporaneamente offline',
    bannerDescription:
      'Il servizio di relevance-check AI ha registrato {{failures}} fallimenti consecutivi ed è stato sospeso. La pipeline continua con soli embeddings.',
    bannerHalfOpen: 'LLM (Ollama) in prova di riavvio',
  },
} as const;
