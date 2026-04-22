#!/usr/bin/env python3
"""
GSI - Global Shopping Insights
Generazione documentazione completa del progetto in PDF.
"""

from fpdf import FPDF
import datetime
import os


class GSIDoc(FPDF):
    BLUE = (22, 119, 255)
    DARK = (30, 30, 30)
    GRAY = (100, 100, 100)
    LIGHT_BG = (245, 247, 250)
    WHITE = (255, 255, 255)
    GREEN = (56, 158, 13)
    ORANGE = (250, 140, 22)
    RED = (207, 34, 46)
    ACCENT = (114, 46, 209)

    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=25)
        self.set_margins(20, 20, 20)
        self.page_w = 210 - 40  # usable width

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*self.GRAY)
        self.cell(0, 6, "Global Shopping Insights - Documentazione Tecnica", align="L")
        self.cell(0, 6, f"Pagina {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*self.BLUE)
        self.set_line_width(0.3)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*self.GRAY)
        self.cell(0, 10, f"Generato il {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')} - GSI v1.0.0", align="C")

    def cover_page(self):
        self.add_page()
        self.ln(50)
        self.set_font("Helvetica", "B", 36)
        self.set_text_color(*self.BLUE)
        self.cell(0, 15, "Global Shopping Insights", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)
        self.set_font("Helvetica", "", 16)
        self.set_text_color(*self.DARK)
        self.cell(0, 10, "Documentazione Tecnica Completa", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(8)
        self.set_font("Helvetica", "I", 12)
        self.set_text_color(*self.GRAY)
        self.cell(0, 8, "Piattaforma di Editorial Intelligence per il Retail Globale", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(20)

        self.set_draw_color(*self.BLUE)
        self.set_line_width(0.5)
        self.line(60, self.get_y(), 150, self.get_y())
        self.ln(20)

        info = [
            ("Versione", "1.0.0-rc1 (preparazione consegna)"),
            ("Data", datetime.datetime.now().strftime("%d/%m/%Y")),
            ("Stack", "FastAPI 0.115 + React 18 + TypeScript 5.6"),
            ("Database", "PostgreSQL (produzione) / SQLite (sviluppo)"),
            ("Deploy", "Docker Compose + Traefik v3 + Let's Encrypt"),
            ("AI Engine", "sentence-transformers (all-MiniLM-L6-v2) + Ollama Qwen 2.5 3B"),
        ]
        for label, value in info:
            self.set_font("Helvetica", "B", 11)
            self.set_text_color(*self.GRAY)
            self.cell(50, 8, f"{label}:", align="R")
            self.set_font("Helvetica", "", 11)
            self.set_text_color(*self.DARK)
            self.cell(0, 8, f"  {value}", new_x="LMARGIN", new_y="NEXT")

    def section_title(self, num, title):
        self.add_page()
        self.set_font("Helvetica", "B", 22)
        self.set_text_color(*self.BLUE)
        self.cell(0, 12, f"{num}. {title}", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*self.BLUE)
        self.set_line_width(0.8)
        self.line(20, self.get_y() + 1, 190, self.get_y() + 1)
        self.ln(8)

    def sub_title(self, title, level=2):
        self.ln(4)
        sizes = {2: 15, 3: 12, 4: 11}
        self.set_font("Helvetica", "B", sizes.get(level, 12))
        self.set_text_color(*self.DARK)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        if level == 2:
            self.set_draw_color(200, 200, 200)
            self.set_line_width(0.3)
            self.line(20, self.get_y(), 120, self.get_y())
        self.ln(3)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*self.DARK)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text, indent=0):
        x = self.get_x() + indent
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*self.DARK)
        self.set_x(x)
        self.cell(5, 5.5, "-")
        self.multi_cell(self.page_w - indent - 5, 5.5, text)
        self.ln(1)

    def bold_bullet(self, label, text, indent=0):
        x = self.get_x() + indent
        self.set_x(x)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*self.DARK)
        self.cell(5, 5.5, "-")
        self.set_font("Helvetica", "B", 10)
        self.cell(self.get_string_width(label) + 1, 5.5, label)
        self.set_font("Helvetica", "", 10)
        self.multi_cell(0, 5.5, f" {text}")
        self.ln(1)

    def code_block(self, text):
        self.ln(2)
        self.set_fill_color(*self.LIGHT_BG)
        self.set_font("Courier", "", 9)
        self.set_text_color(60, 60, 60)
        lines = text.strip().split("\n")
        for line in lines:
            safe = line.replace("\t", "    ")
            self.cell(0, 5, f"  {safe}", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(*self.DARK)
        self.ln(3)

    def info_box(self, title, text, color=None):
        if color is None:
            color = self.BLUE
        self.ln(2)
        self.set_fill_color(color[0], color[1], color[2])
        self.rect(20, self.get_y(), 3, 18, "F")
        self.set_x(26)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*color)
        self.cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.set_x(26)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*self.DARK)
        self.multi_cell(self.page_w - 6, 5, text)
        self.ln(4)

    def table_header(self, cols, widths):
        self.set_fill_color(*self.BLUE)
        self.set_text_color(*self.WHITE)
        self.set_font("Helvetica", "B", 9)
        for i, col in enumerate(cols):
            self.cell(widths[i], 7, f" {col}", border=1, fill=True)
        self.ln()

    def table_row(self, cols, widths, fill=False):
        if fill:
            self.set_fill_color(248, 249, 252)
        else:
            self.set_fill_color(*self.WHITE)
        self.set_text_color(*self.DARK)
        self.set_font("Helvetica", "", 8.5)
        max_h = 7
        for i, col in enumerate(cols):
            self.cell(widths[i], max_h, f" {col}", border=1, fill=True)
        self.ln()

    def status_badge(self, status, x=None):
        colors = {
            "imported": (22, 119, 255),
            "screened": (114, 46, 209),
            "in_review": (250, 140, 22),
            "approved": (56, 158, 13),
            "scheduled": (19, 194, 194),
            "publishing": (250, 173, 20),
            "published": (56, 158, 13),
            "rejected": (207, 34, 46),
            "publish_failed": (207, 34, 46),
        }
        c = colors.get(status, self.GRAY)
        if x:
            self.set_x(x)
        self.set_fill_color(*c)
        self.set_text_color(*self.WHITE)
        self.set_font("Helvetica", "B", 8)
        w = self.get_string_width(status) + 6
        self.cell(w, 6, f" {status} ", fill=True)
        self.set_text_color(*self.DARK)


def build_pdf():
    pdf = GSIDoc()

    # =========================================================
    # COVER
    # =========================================================
    pdf.cover_page()

    # =========================================================
    # TABLE OF CONTENTS
    # =========================================================
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*pdf.BLUE)
    pdf.cell(0, 12, "Indice", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    toc = [
        ("1", "Panoramica del Progetto"),
        ("2", "Architettura del Sistema"),
        ("3", "Stack Tecnologico"),
        ("4", "Modello Dati (Database)"),
        ("5", "Il Flusso Completo: dalla Raccolta alla Pubblicazione"),
        ("6", "Fase 1 - Configurazione Prompt di Ricerca"),
        ("7", "Fase 2 - Discovery Pipeline (Raccolta Articoli)"),
        ("8", "Fase 3 - Scraping dei Contenuti"),
        ("9", "Fase 4 - Scoring AI e Deduplicazione"),
        ("10", "Fase 5 - Inbox e Screening Editoriale"),
        ("11", "Fase 6 - Revisione e Approvazione"),
        ("12", "Fase 7 - Pianificazione Calendario Editoriale"),
        ("13", "Fase 8 - Pubblicazione su WordPress"),
        ("14", "Sincronizzazione Tassonomia WordPress"),
        ("15", "Sistema di Notifiche e Commenti"),
        ("16", "Autenticazione e Ruoli (RBAC)"),
        ("17", "Scheduler e Job in Background"),
        ("18", "API Reference (Riepilogo Endpoint)"),
        ("19", "Frontend - Interfaccia Utente"),
        ("20", "Diagramma di Flusso Completo"),
    ]
    for num, title in toc:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*pdf.BLUE)
        pdf.cell(12, 7, num)
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(*pdf.DARK)
        pdf.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")

    # =========================================================
    # 1. PANORAMICA
    # =========================================================
    pdf.section_title("1", "Panoramica del Progetto")
    pdf.body_text(
        "Global Shopping Insights (GSI) e' una piattaforma di Editorial Intelligence progettata per "
        "automatizzare la scoperta, valutazione e pubblicazione di notizie sul retail e shopping globale. "
        "Il sistema combina ricerca automatizzata (DuckDuckGo), scraping intelligente dei contenuti, "
        "scoring semantico tramite AI e pubblicazione diretta su WordPress."
    )
    pdf.body_text(
        "La piattaforma e' pensata per team editoriali che necessitano di monitorare costantemente "
        "il panorama informativo del retail mondiale, filtrare i contenuti piu' rilevanti e pubblicarli "
        "in modo rapido e strutturato."
    )

    pdf.sub_title("Funzionalita' Principali")
    pdf.bold_bullet("Ricerca Automatica:", "Configurazione di prompt di ricerca con keyword, filtri per lingua, paese e profondita' temporale")
    pdf.bold_bullet("Scraping Intelligente:", "Estrazione automatica del contenuto principale tramite trafilatura")
    pdf.bold_bullet("AI Scoring:", "Valutazione semantica della rilevanza (0-100) tramite sentence-transformers")
    pdf.bold_bullet("Deduplicazione:", "Doppio controllo su URL canonico e hash del contenuto")
    pdf.bold_bullet("Workflow Editoriale:", "Pipeline completa da imported a published con ruoli e permessi")
    pdf.bold_bullet("Calendario Editoriale:", "Drag & drop per pianificare la pubblicazione")
    pdf.bold_bullet("WordPress Publishing:", "Pubblicazione automatica via REST API con immagini e tassonomia")
    pdf.bold_bullet("Tassonomia Bidirezionale:", "Sincronizzazione completa tag/categorie con WordPress")

    # =========================================================
    # 2. ARCHITETTURA
    # =========================================================
    pdf.section_title("2", "Architettura del Sistema")
    pdf.body_text(
        "GSI segue un'architettura client-server classica con separazione netta tra frontend e backend. "
        "Il backend e' un'API REST stateless (FastAPI), il frontend e' una SPA React che comunica "
        "esclusivamente tramite chiamate HTTP."
    )

    pdf.sub_title("Backend (FastAPI)")
    pdf.body_text("Il backend segue il pattern a layer:")
    pdf.bold_bullet("API Layer (Routers):", "Gestione HTTP, validazione input, autorizzazione")
    pdf.bold_bullet("Service Layer:", "Logica di business (discovery, scraping, AI, WordPress)")
    pdf.bold_bullet("Model Layer (SQLAlchemy):", "Definizione tabelle, relazioni, query")
    pdf.bold_bullet("Schema Layer (Pydantic):", "Validazione request/response, serializzazione")

    pdf.sub_title("Frontend (React + TypeScript)")
    pdf.body_text("Il frontend segue il pattern:")
    pdf.bold_bullet("Pages:", "Componenti pagina (Dashboard, Inbox, Calendar, ecc.)")
    pdf.bold_bullet("Hooks/Queries:", "React Query hooks per data fetching e caching")
    pdf.bold_bullet("Services/API:", "Client HTTP (axios) per comunicazione col backend")
    pdf.bold_bullet("Stores (Zustand):", "Stato globale (auth, UI, calendario, notifiche)")
    pdf.bold_bullet("Types:", "Definizioni TypeScript per type safety")

    pdf.sub_title("Comunicazione")
    pdf.code_block(
        "Internet --HTTPS--> Traefik v3 (Let's Encrypt) --> Frontend (nginx, SPA)\n"
        "                                                        |\n"
        "                                                        v (proxy /api)\n"
        "                                                  Backend (FastAPI + gunicorn)\n"
        "                                                        |\n"
        "                                         +--------------+--------------+\n"
        "                                         v                             v\n"
        "                                   PostgreSQL 16               Ollama (opz.)\n"
        "                                  (volume: gsi_postgres_data)  Qwen 2.5 3B\n"
        "                                                               second-opinion\n"
        "\n"
        "Backend --HTTP--> WordPress REST API (wp-json/wp/v2)\n"
        "\n"
        "In dev locale il DB puo' essere SQLite (file backend/gsi.db) per setup rapido."
    )

    # =========================================================
    # 3. STACK TECNOLOGICO
    # =========================================================
    pdf.section_title("3", "Stack Tecnologico")

    pdf.sub_title("Backend")
    headers = ["Componente", "Tecnologia", "Versione/Note"]
    widths = [45, 50, 75]
    pdf.table_header(headers, widths)
    rows = [
        ("Framework", "FastAPI 0.115", "API REST async, auto-docs Swagger"),
        ("ORM", "SQLAlchemy 2.0", "DeclarativeBase, sync session (async rinviato)"),
        ("Database (prod)", "PostgreSQL", "psycopg[binary] 3.2, pool 5+10, pre-ping"),
        ("Database (dev)", "SQLite", "WAL mode, FK enforced, file: backend/gsi.db"),
        ("Migrazioni", "Alembic", "baseline + autogenerate, gestito da Alembic"),
        ("Validazione", "Pydantic 2.x", "Request/response schemas"),
        ("AI / NLP", "sentence-transformers", "all-MiniLM-L6-v2 (384-dim)"),
        ("Similarita'", "scikit-learn", "cosine_similarity per scoring"),
        ("LLM 2nd opinion", "Ollama Qwen 2.5 3B", "Locale, richiede ~4GB RAM"),
        ("Ricerca", "ddgs (DuckDuckGo)", "Ricerca web programmatica"),
        ("Scraping", "trafilatura + httpx", "Content extraction + HTTP client"),
        ("Date Detection", "htmldate + py3langid", "Fallback date + lang detection"),
        ("Scheduling", "APScheduler", "Background jobs in-process (ARQ in roadmap)"),
        ("Auth", "PyJWT + bcrypt", "HS256 tokens, refresh rotation con revoca"),
        ("Encryption", "cryptography (Fernet)", "Cifratura wp_app_password a riposo"),
        ("Rate limit", "slowapi", "Sugli endpoint sensibili (login/refresh/publish)"),
        ("Sanitization", "bleach", "HTML sanitization lato backend"),
        ("Logging", "structlog", "JSON in prod, console dev, PII masking"),
        ("Deploy", "Docker + gunicorn", "Multi-stage, non-root, HEALTHCHECK"),
        ("TLS / Routing", "Traefik v3 + ACME", "Let's Encrypt HTTP-01 automatico"),
    ]
    for i, r in enumerate(rows):
        pdf.table_row(r, widths, fill=i % 2 == 0)

    pdf.ln(4)
    pdf.sub_title("Frontend")
    rows_fe = [
        ("Framework", "React 18", "SPA con hooks e Suspense"),
        ("Linguaggio", "TypeScript", "Type safety completo"),
        ("Build Tool", "Vite", "Dev server :5173, HMR"),
        ("UI Library", "Ant Design 5", "Component library completa"),
        ("State Mgmt", "Zustand", "4 stores: auth, UI, calendar, notif."),
        ("Data Fetching", "React Query", "Caching, invalidation, mutations"),
        ("HTTP Client", "axios", "Interceptor per JWT auto-refresh"),
        ("Drag & Drop", "@dnd-kit/core", "Calendario editoriale"),
        ("Date", "dayjs", "Localizzazione italiana"),
        ("Routing", "react-router v6", "Protected routes, lazy loading"),
    ]
    pdf.table_header(headers, widths)
    for i, r in enumerate(rows_fe):
        pdf.table_row(r, widths, fill=i % 2 == 0)

    # =========================================================
    # 4. MODELLO DATI
    # =========================================================
    pdf.section_title("4", "Modello Dati (Database)")
    pdf.body_text(
        "Il database (PostgreSQL in produzione, SQLite in sviluppo) contiene 18 tabelle principali "
        "piu' 3 tabelle di junction (many-to-many). Le migrazioni sono gestite da Alembic; il baseline "
        "crea lo schema completo con un singolo 'alembic upgrade head'. Lo schema e' identico tra i due "
        "engine grazie al dispatch dinamico dei kwargs in app/database.py."
    )

    pdf.sub_title("Tabelle Principali")
    t_headers = ["Tabella", "Scopo", "Campi Chiave"]
    t_widths = [35, 50, 85]
    pdf.table_header(t_headers, t_widths)
    tables = [
        ("users", "Utenti e ruoli", "email, name, password_hash, role, is_active"),
        ("refresh_tokens", "JWT refresh token", "jti UNIQUE, user_id, expires_at, revoked_at"),
        ("articles", "Articoli raccolti", "canonical_url, title, content_text, ai_score, status"),
        ("article_revisions", "Storico modifiche", "article_id, version, editor_id, changes"),
        ("prompts", "Config. ricerca", "title, keywords, excluded_keywords, schedule_*, folder_id"),
        ("prompt_folders", "Cartelle prompt", "name, parent_id (gerarchia)"),
        ("search_runs", "Esecuzioni ricerca", "prompt_id, status, articles_created, errors"),
        ("search_results", "Risultati singoli", "search_run_id, url, article_id"),
        ("tags", "Tag tassonomia", "name, slug, wp_id"),
        ("categories", "Categorie (gerarchiche)", "name, slug, parent_id, wp_id"),
        ("editorial_slots", "Slot calendario", "article_id, scheduled_for, timezone, status"),
        ("calendar_rules", "Regole pianificaz.", "rule_type, value, is_active"),
        ("comments", "Commenti articoli", "article_id, user_id, body, mentions"),
        ("notifications", "Notifiche utente", "user_id, type, title, is_read"),
        ("wp_config", "Config WordPress", "wp_url, wp_username, wp_app_password (Fernet)"),
        ("wp_posts", "Post pubblicati", "article_id, wp_post_id, wp_url, wp_status"),
        ("blocked_domains", "Domini bloccati", "domain, reason"),
        ("job_logs", "Log background jobs", "job_type, entity_ref, status, error"),
        ("audit_logs", "Audit trail", "user_id, action, entity, entity_id, metadata"),
    ]
    for i, r in enumerate(tables):
        pdf.table_row(r, t_widths, fill=i % 2 == 0)

    pdf.ln(4)
    pdf.sub_title("Relazioni Many-to-Many")
    pdf.bold_bullet("article_tags:", "articles <-> tags (composita: article_id + tag_id)")
    pdf.bold_bullet("article_categories:", "articles <-> categories (composita: article_id + category_id)")
    pdf.bold_bullet("article_prompts:", "articles <-> prompts (traccia quale prompt ha scoperto l'articolo)")

    pdf.sub_title("Campi Articolo - Dettaglio Completo")
    pdf.body_text("La tabella articles e' il cuore del sistema. Contiene 22 colonne:")
    a_cols = [
        ("canonical_url", "TEXT UNIQUE", "URL normalizzato (chiave dedup)"),
        ("source_domain", "VARCHAR(255)", "Dominio di origine"),
        ("title", "VARCHAR(500)", "Titolo articolo"),
        ("author", "VARCHAR(255)", "Autore (opzionale)"),
        ("published_at", "DATETIME", "Data pubblicazione originale"),
        ("language", "VARCHAR(10)", "Codice lingua ISO 639-1"),
        ("content_html", "TEXT", "Contenuto HTML completo"),
        ("content_text", "TEXT", "Testo estratto (plain text)"),
        ("content_hash", "VARCHAR(64)", "SHA-256 per dedup contenuto"),
        ("status", "VARCHAR(20)", "Stato workflow corrente"),
        ("featured_image_url", "TEXT", "URL immagine di copertina"),
        ("ai_score", "INTEGER", "Punteggio rilevanza AI (0-100)"),
        ("ai_score_explanation", "JSON", "Array spiegazioni scoring"),
        ("ai_suggested_tags", "JSON", "Tag suggeriti dall'AI"),
        ("ai_suggested_category", "VARCHAR(100)", "Categoria suggerita AI"),
    ]
    ah = ["Campo", "Tipo", "Descrizione"]
    aw = [42, 38, 90]
    pdf.table_header(ah, aw)
    for i, r in enumerate(a_cols):
        pdf.table_row(r, aw, fill=i % 2 == 0)

    # =========================================================
    # 5. FLUSSO COMPLETO
    # =========================================================
    pdf.section_title("5", "Il Flusso Completo: dalla Raccolta alla Pubblicazione")
    pdf.body_text(
        "Questo e' il cuore della documentazione. Il flusso completo di un articolo nel sistema GSI "
        "si compone di 8 fasi principali, dall'ideazione della ricerca fino alla pubblicazione finale "
        "su WordPress."
    )

    pdf.info_box("Flusso in Sintesi",
        "Prompt -> DuckDuckGo Search -> Scraping -> AI Scoring -> Inbox Review -> "
        "Editorial Approval -> Calendar Scheduling -> WordPress Publishing",
        pdf.BLUE)

    pdf.sub_title("Diagramma degli Stati dell'Articolo")
    pdf.code_block(
        "  [imported] -----> [screened] -----> [in_review]\n"
        "      |                                   |\n"
        "      |                          +--------+--------+\n"
        "      |                          |                 |\n"
        "      v                     [approved]        [rejected]\n"
        "  [rejected]                     |                 |\n"
        "                                 v             (admin)\n"
        "                           [scheduled]     back to imported\n"
        "                                 |\n"
        "                                 v\n"
        "                          [publishing]\n"
        "                          /          \\\n"
        "                         v            v\n"
        "                  [published]   [publish_failed]\n"
        "                                      |\n"
        "                                      v\n"
        "                               back to [scheduled]"
    )

    pdf.sub_title("Transizioni di Stato per Ruolo")
    tr_h = ["Da", "A", "Ruoli Autorizzati"]
    tr_w = [40, 40, 90]
    pdf.table_header(tr_h, tr_w)
    transitions = [
        ("imported", "screened", "contributor, editor, reviewer, admin"),
        ("imported", "rejected", "editor, reviewer, admin"),
        ("screened", "in_review", "editor, admin"),
        ("screened", "rejected", "editor, reviewer, admin"),
        ("in_review", "approved", "reviewer, admin"),
        ("in_review", "rejected", "reviewer, admin"),
        ("in_review", "screened", "reviewer, admin"),
        ("approved", "scheduled", "editor, reviewer, admin"),
        ("scheduled", "approved", "editor, reviewer, admin"),
        ("scheduled", "publishing", "admin"),
        ("publish_failed", "scheduled", "editor, reviewer, admin"),
        ("rejected", "imported", "admin"),
    ]
    for i, r in enumerate(transitions):
        pdf.table_row(r, tr_w, fill=i % 2 == 0)

    # =========================================================
    # 6. FASE 1 - PROMPT
    # =========================================================
    pdf.section_title("6", "Fase 1 - Configurazione Prompt di Ricerca")
    pdf.body_text(
        "Il processo inizia con la creazione di un Prompt di ricerca. Un prompt definisce COSA cercare, "
        "DOVE cercare e con quale frequenza. E' il punto di partenza dell'intera pipeline."
    )

    pdf.sub_title("Parametri del Prompt")
    pdf.bold_bullet("title:", "Nome identificativo della ricerca (es. 'E-commerce Italia Q1 2026')")
    pdf.bold_bullet("keywords:", "Array di parole chiave da cercare (es. ['e-commerce', 'retail', 'shopping online'])")
    pdf.bold_bullet("excluded_keywords:", "Parole da escludere dai risultati (es. ['crypto', 'bitcoin'])")
    pdf.bold_bullet("language:", "Filtro lingua (es. 'it', 'en', 'fr')")
    pdf.bold_bullet("countries:", "Paesi target (es. ['IT', 'US', 'UK'])")
    pdf.bold_bullet("time_depth:", "Profondita' temporale: '24h', '7d', '30d', '90d'")
    pdf.bold_bullet("max_results:", "Numero massimo risultati per esecuzione (default: 20)")

    pdf.sub_title("Schedulazione Automatica")
    pdf.body_text(
        "Ogni prompt puo' essere schedulato per l'esecuzione automatica:"
    )
    pdf.bold_bullet("schedule_enabled:", "Abilita/disabilita l'esecuzione automatica")
    pdf.bold_bullet("schedule_frequency_hours:", "Intervallo in ore tra le esecuzioni (es. 6, 12, 24)")
    pdf.bold_bullet("schedule_specific_times:", "Orari specifici (es. ['09:00', '18:00'])")
    pdf.bold_bullet("schedule_next_run_at:", "Prossima esecuzione calcolata automaticamente")

    pdf.info_box("Scheduler",
        "APScheduler controlla ogni 5 minuti se ci sono prompt da eseguire. "
        "Se schedule_next_run_at <= now, lancia run_discovery_pipeline() e aggiorna il prossimo orario.",
        pdf.GREEN)

    # =========================================================
    # 7. FASE 2 - DISCOVERY
    # =========================================================
    pdf.section_title("7", "Fase 2 - Discovery Pipeline (Raccolta Articoli)")
    pdf.body_text(
        "La Discovery Pipeline e' il motore centrale che orchestra la raccolta degli articoli. "
        "Viene attivata manualmente (click 'Esegui Ricerca' dal frontend) o automaticamente dallo scheduler."
    )

    pdf.sub_title("Funzione: run_discovery_pipeline(prompt_id, user_id)")
    pdf.body_text("Questa funzione esegue i seguenti passaggi in sequenza:")

    pdf.bold_bullet("1. Caricamento Prompt:", "Recupera il prompt dal database con tutti i parametri")
    pdf.bold_bullet("2. Creazione SearchRun:", "Registra una nuova esecuzione con status='running'")
    pdf.bold_bullet("3. Creazione JobLog:", "Log per audit e monitoraggio")
    pdf.bold_bullet("4. Caricamento Blocklist:", "Recupera tutti i domini bloccati dall'admin")
    pdf.bold_bullet("5. Ricerca DuckDuckGo:", "Esegue la query costruita dal prompt")
    pdf.bold_bullet("6. Per ogni risultato:", "Normalizza URL -> Controlla blocklist -> Scraping -> Dedup -> AI Scoring -> Salvataggio")
    pdf.bold_bullet("7. Aggiornamento SearchRun:", "Statistiche finali (urls_found, articles_created, duplicates_skipped, errors_count)")

    pdf.sub_title("Costruzione della Query DuckDuckGo")
    pdf.body_text("La query viene costruita cosi':")
    pdf.code_block(
        "# Priorita' 1: usa prompt.description come query\n"
        "# Priorita' 2: se vuoto, join delle keywords\n"
        "query = prompt.description or ' '.join(prompt.keywords)\n"
        "\n"
        "# Aggiunta excluded_keywords come termini negativi\n"
        "for kw in prompt.excluded_keywords:\n"
        "    query += f' -{kw}'\n"
        "\n"
        "# Mapping time_depth -> DuckDuckGo format\n"
        "# '24h' -> 'd', '7d' -> 'w', '30d' -> 'm', '90d' -> 'm'\n"
        "\n"
        "# Mapping countries -> DuckDuckGo regions\n"
        "# IT->it-it, US->us-en, UK->uk-en, FR->fr-fr, DE->de-de, ES->es-es"
    )

    pdf.sub_title("Gestione Errori nella Pipeline")
    pdf.body_text(
        "La pipeline e' progettata per essere resiliente: un errore su un singolo risultato NON "
        "interrompe l'elaborazione degli altri. Ogni risultato e' gestito in un try-except individuale "
        "con rollback del database per quel singolo record."
    )

    # =========================================================
    # 8. FASE 3 - SCRAPING
    # =========================================================
    pdf.section_title("8", "Fase 3 - Scraping dei Contenuti")
    pdf.body_text(
        "Per ogni URL scoperto dalla ricerca, il Scraper Service estrae il contenuto principale "
        "e i metadati dell'articolo."
    )

    pdf.sub_title("Funzione: scrape_url(url, timeout=30)")
    pdf.body_text("Il processo di scraping si articola in 3 fasi:")

    pdf.bold_bullet("1. Download HTTP:", "Richiesta GET con User-Agent Chrome, Accept-Language en/it, follow_redirects=True, timeout 30s")
    pdf.bold_bullet("2. Estrazione Testo:", "trafilatura.extract() con include_tables=True, include_links=True, output_format='txt'")
    pdf.bold_bullet("3. Estrazione Metadati:", "trafilatura.bare_extraction() per title, author, date, image, language")

    pdf.sub_title("Output dello Scraper")
    pdf.code_block(
        "{\n"
        '    "text": "Contenuto principale dell\'articolo...",\n'
        '    "html": "<html>...</html>",\n'
        '    "title": "Titolo dell\'articolo",\n'
        '    "author": "Nome Autore",\n'
        '    "date": "2026-02-08T10:30:00",\n'
        '    "image": "https://example.com/hero.jpg",\n'
        '    "language": "en"\n'
        "}"
    )

    pdf.sub_title("Fallback per la Data")
    pdf.body_text(
        "Se trafilatura non riesce a estrarre la data di pubblicazione, il sistema usa "
        "htmldate.find_date(html) come fallback. Il discovery service poi tenta il parsing "
        "con 9 formati diversi ('%Y-%m-%d', '%d/%m/%Y', '%B %d, %Y', ecc.)."
    )

    # =========================================================
    # 9. FASE 4 - AI SCORING
    # =========================================================
    pdf.section_title("9", "Fase 4 - Scoring AI e Deduplicazione")

    pdf.sub_title("Deduplicazione (doppio livello)")
    pdf.body_text("Prima dello scoring, il sistema verifica che l'articolo non sia un duplicato:")
    pdf.bold_bullet("Livello 1 - URL:", "Confronto del canonical_url normalizzato contro il database (indice UNIQUE)")
    pdf.bold_bullet("Livello 2 - Contenuto:", "SHA-256 hash del testo normalizzato (content_hash). Rileva stesso contenuto da URL diversi")

    pdf.sub_title("AI Scoring: score_article(text, prompt_text, keywords)")
    pdf.body_text(
        "Il cuore dell'intelligenza artificiale del sistema. Usa il modello sentence-transformers "
        "all-MiniLM-L6-v2 per calcolare la similarita' semantica tra l'articolo e il prompt."
    )

    pdf.bold_bullet("1. Encoding:", "Converte testo articolo (primi 2000 char) e descrizione prompt in vettori a 384 dimensioni")
    pdf.bold_bullet("2. Cosine Similarity:", "Calcola la similarita' coseno tra i due vettori")
    pdf.bold_bullet("3. Calibrazione:", "score = similarity * 100 * 1.5 (fattore 1.5x), limitato a 0-100")
    pdf.bold_bullet("4. Keyword Matching:", "Conta quante keyword del prompt appaiono nel testo")
    pdf.bold_bullet("5. Tag Suggestion:", "Le keyword trovate nel testo diventano tag suggeriti (max 5)")
    pdf.bold_bullet("6. Category Suggestion:", "Pattern matching su 6 categorie predefinite")

    pdf.sub_title("Categorie AI Predefinite")
    cat_h = ["Categoria", "Keyword Pattern"]
    cat_w = [50, 120]
    pdf.table_header(cat_h, cat_w)
    cats = [
        ("E-commerce", "ecommerce, e-commerce, online shopping, online store, marketplace"),
        ("Retail Technology", "retail tech, pos system, checkout, payment technology"),
        ("Consumer Trends", "consumer, trend, shopping behavior, spending"),
        ("Logistics", "supply chain, logistics, delivery, shipping, warehouse"),
        ("Market Analysis", "market analysis, market research, industry report, forecast"),
        ("Sustainability", "sustainable, sustainability, green, eco-friendly, circular"),
    ]
    for i, r in enumerate(cats):
        pdf.table_row(r, cat_w, fill=i % 2 == 0)

    pdf.ln(3)
    pdf.sub_title("Output dello Scoring")
    pdf.code_block(
        "{\n"
        '    "score": 78,\n'
        '    "explanation": [\n'
        '        "Matched 4/6 keywords",\n'
        '        "Semantic similarity: 0.52",\n'
        '        "High relevance"\n'
        "    ],\n"
        '    "tags": ["e-commerce", "retail", "shopping", "online"],\n'
        '    "category": "E-commerce",\n'
        '    "model_version": "all-MiniLM-L6-v2"\n'
        "}"
    )

    pdf.sub_title("Fallback Scoring")
    pdf.body_text(
        "Se il modello sentence-transformers non e' disponibile, il sistema usa un fallback "
        "basato solo su keyword matching: conta le parole del prompt (>3 char) che appaiono "
        "nel testo e aggiunge +10 punti per ogni keyword trovata. model_version = 'fallback-keyword'."
    )

    pdf.info_box("Soglie di Rilevanza",
        "Score >= 75: Alta rilevanza (verde) | Score >= 50: Media rilevanza (arancione) | Score < 50: Bassa rilevanza (rosso)",
        pdf.ORANGE)

    # =========================================================
    # 10. FASE 5 - INBOX
    # =========================================================
    pdf.section_title("10", "Fase 5 - Inbox e Screening Editoriale")
    pdf.body_text(
        "Dopo la discovery, gli articoli arrivano nell'Inbox con status 'imported'. "
        "Qui il team editoriale li vaglia, filtra e decide quali meritano approfondimento."
    )

    pdf.sub_title("Filtri Disponibili")
    pdf.bold_bullet("Ricerca testuale:", "Ricerca su titolo e contenuto (debounce 350ms)")
    pdf.bold_bullet("Status:", "Multi-selezione di stati del workflow")
    pdf.bold_bullet("Lingua:", "Filtro per codice lingua (en, it, fr, de, es)")
    pdf.bold_bullet("Punteggio AI:", "Slider range 0-100 per filtrare per rilevanza")
    pdf.bold_bullet("Dominio:", "Filtro per dominio sorgente")
    pdf.bold_bullet("Paese:", "Filtro per paese di origine")

    pdf.sub_title("Operazioni Batch")
    pdf.body_text("L'Inbox supporta operazioni massive su articoli selezionati:")
    pdf.bold_bullet("Cambia Stato:", "Sposta tutti gli articoli selezionati a un nuovo stato")
    pdf.bold_bullet("Aggiungi Tag:", "Assegna tag a tutti gli articoli selezionati")
    pdf.bold_bullet("Scarta:", "Elimina gli articoli selezionati (con conferma)")

    pdf.sub_title("Preview Drawer")
    pdf.body_text(
        "Cliccando su un articolo nell'Inbox si apre un drawer laterale con anteprima rapida: "
        "titolo, punteggio AI, contenuto e azioni rapide (screened/rejected)."
    )

    # =========================================================
    # 11. FASE 6 - REVISIONE
    # =========================================================
    pdf.section_title("11", "Fase 6 - Revisione e Approvazione")
    pdf.body_text(
        "Gli articoli promossi a 'screened' passano alla fase di revisione approfondita. "
        "La pagina di dettaglio articolo offre tutti gli strumenti necessari."
    )

    pdf.sub_title("Pagina Dettaglio Articolo")
    pdf.body_text("Layout a due colonne:")

    pdf.bold_bullet("Colonna Sinistra (2/3):", "Contenuto articolo (testo + immagini) e thread commenti")
    pdf.bold_bullet("Colonna Destra (1/3):", "Metadati, pannello AI Score, assegnazione tag/categorie")

    pdf.sub_title("Pannello AI Score")
    pdf.body_text(
        "Mostra il punteggio di rilevanza con un indicatore circolare colorato "
        "(verde >= 75, arancione >= 50, rosso < 50) e le spiegazioni del punteggio come bullet points."
    )

    pdf.sub_title("Assegnazione Tag e Categorie")
    pdf.body_text(
        "L'editor puo' assegnare tag e categorie all'articolo tramite dropdown con ricerca. "
        "I tag/categorie suggeriti dall'AI vengono evidenziati come suggerimenti. "
        "Tag e categorie sono sincronizzati bidirezionalmente con WordPress."
    )

    pdf.sub_title("Sistema Commenti")
    pdf.body_text(
        "Thread di commenti per collaborazione editoriale. Ogni commento ha: autore, "
        "timestamp, testo e supporto per menzioni (@utente)."
    )

    pdf.sub_title("Editing Articolo")
    pdf.body_text(
        "L'editor puo' modificare: titolo, contenuto HTML/text, autore, lingua, paese, immagine. "
        "Ogni modifica crea una ArticleRevision per tracciabilita' completa."
    )

    # =========================================================
    # 12. FASE 7 - CALENDARIO
    # =========================================================
    pdf.section_title("12", "Fase 7 - Pianificazione Calendario Editoriale")
    pdf.body_text(
        "Gli articoli approvati possono essere pianificati nel calendario editoriale. "
        "Il calendario supporta viste mese, settimana e giorno con drag & drop."
    )

    pdf.sub_title("Funzionamento")
    pdf.bold_bullet("Sidebar:", "Lista articoli 'approved' pronti per la pianificazione")
    pdf.bold_bullet("Drag & Drop:", "Trascina un articolo dalla sidebar al calendario")
    pdf.bold_bullet("ScheduleModal:", "Si apre per selezionare data e ora esatta (slot 6:00-22:00)")
    pdf.bold_bullet("Collision Check:", "Verifica automatica del numero massimo di post per giorno")
    pdf.bold_bullet("Slot Creation:", "Crea un EditorialSlot e imposta l'articolo come 'scheduled'")

    pdf.sub_title("Regole del Calendario")
    pdf.body_text(
        "Le CalendarRules definiscono vincoli configurabili dall'admin:"
    )
    pdf.bold_bullet("max_per_day:", "Numero massimo di pubblicazioni per giorno (default: 10)")
    pdf.bold_bullet("min_spacing_hours:", "Distanza minima in ore tra due pubblicazioni")

    pdf.sub_title("Viste Calendario")
    pdf.bold_bullet("Vista Mese:", "Griglia 6 settimane con conteggio slot per giorno e slot cards")
    pdf.bold_bullet("Vista Settimana:", "7 colonne per una settimana con slot dettagliati")
    pdf.bold_bullet("Vista Giorno:", "Slot orari (6:00-22:00) per un singolo giorno")

    pdf.info_box("Timezone",
        "Tutti gli slot usano il fuso orario Europe/Rome come default. "
        "Le date nel frontend sono formattate con locale italiano (dayjs.locale('it')).",
        pdf.ACCENT)

    # =========================================================
    # 13. FASE 8 - WORDPRESS PUBLISHING
    # =========================================================
    pdf.section_title("13", "Fase 8 - Pubblicazione su WordPress")
    pdf.body_text(
        "La fase finale: l'articolo viene pubblicato automaticamente su WordPress "
        "tramite la REST API. Puo' essere attivata manualmente o dallo scheduler automatico."
    )

    pdf.sub_title("Funzione: publish_to_wordpress(article_id)")
    pdf.body_text("Il processo di pubblicazione segue questi passaggi:")

    pdf.bold_bullet("1. Verifica Config:", "Controlla che WPConfig abbia wp_url e wp_username configurati")
    pdf.bold_bullet("2. Conversione HTML:", "Converte content_text in HTML con paragrafi (<p>) e a capo (<br>)")
    pdf.bold_bullet("3. Mapping Tassonomia:", "Recupera i wp_id di tag e categorie assegnati all'articolo")
    pdf.bold_bullet("4. Upload Immagine:", "Se presente, carica l'immagine di copertina come media WP")
    pdf.bold_bullet("5. Creazione Post:", "POST a /wp-json/wp/v2/posts con title, content, categories, tags, featured_media")
    pdf.bold_bullet("6. Record WPPost:", "Salva il mapping article_id -> wp_post_id, wp_url")
    pdf.bold_bullet("7. Aggiornamento Status:", "Articolo -> 'published', slot -> 'published'")

    pdf.sub_title("Upload Immagine di Copertina")
    pdf.body_text("Supporta due sorgenti:")
    pdf.bold_bullet("Locale:", "File caricati in /uploads/ -> letti da disco")
    pdf.bold_bullet("Remota:", "URL esterni -> scaricati via httpx e ri-caricati su WP")
    pdf.body_text(
        "L'immagine viene caricata su /wp-json/wp/v2/media con il Content-Type corretto "
        "(image/jpeg, image/png, image/gif, image/webp)."
    )

    pdf.sub_title("Autenticazione WordPress")
    pdf.body_text(
        "Il sistema usa Basic Authentication con username e Application Password di WordPress. "
        "Le credenziali sono memorizzate nella tabella wp_config (singleton, id=1)."
    )

    pdf.sub_title("Gestione Errori di Pubblicazione")
    pdf.body_text(
        "Se la pubblicazione fallisce, l'articolo viene impostato su status 'publish_failed' "
        "e il JobLog registra l'errore. L'utente puo' ritentare tramite l'endpoint "
        "POST /api/v1/publish/{article_id}/retry."
    )

    pdf.sub_title("Pubblicazione Automatica via Scheduler")
    pdf.body_text(
        "Lo scheduler controlla ogni 1 minuto se ci sono slot con status='scheduled' e "
        "scheduled_for <= now. Per ognuno, imposta lo stato a 'publishing' e chiama "
        "publish_to_wordpress(). Il risultato aggiorna sia l'articolo che lo slot."
    )

    # =========================================================
    # 14. TASSONOMIA WP
    # =========================================================
    pdf.section_title("14", "Sincronizzazione Tassonomia WordPress")
    pdf.body_text(
        "GSI mantiene una sincronizzazione bidirezionale di tag e categorie con WordPress. "
        "Questo garantisce che la tassonomia sia sempre allineata tra i due sistemi."
    )

    pdf.sub_title("Sync Bidirezionale: sync_from_wordpress()")
    pdf.body_text("La sincronizzazione completa avviene in 4 fasi per ogni tipo (tag e categorie):")

    pdf.bold_bullet("1. Pull da WP:", "Scarica tutti i tag/categorie da WordPress (paginazione a 100)")
    pdf.bold_bullet("2. Upsert Locale:", "Per ogni item WP: se esiste localmente (match su wp_id o slug) -> aggiorna; altrimenti -> crea")
    pdf.bold_bullet("3. Push su WP:", "Tag/categorie locali senza wp_id vengono creati su WordPress")
    pdf.bold_bullet("4. Pulizia Orfani:", "Tag/categorie locali con wp_id che non esistono piu' su WP vengono rimossi")

    pdf.sub_title("Operazioni Singole")
    pdf.body_text("Ogni operazione CRUD su tag/categorie nel frontend viene sincronizzata immediatamente:")
    pdf.bold_bullet("Creazione:", "Crea localmente -> push su WP -> salva wp_id. Se WP fallisce, rollback locale")
    pdf.bold_bullet("Modifica:", "Aggiorna localmente -> push su WP. Se WP fallisce, revert in-memory")
    pdf.bold_bullet("Eliminazione:", "Elimina da WP (DELETE ?force=true) -> poi elimina localmente")

    pdf.sub_title("Gestione Conflitti Slug")
    pdf.body_text(
        "Se uno slug importato da WP confligge con uno locale diverso, il sistema "
        "appende '-wp' allo slug per risolvere il conflitto."
    )

    # =========================================================
    # 15. NOTIFICHE E COMMENTI
    # =========================================================
    pdf.section_title("15", "Sistema di Notifiche e Commenti")

    pdf.sub_title("Notifiche")
    pdf.body_text(
        "Il sistema genera notifiche per eventi importanti. Ogni utente vede solo le proprie "
        "notifiche nel bell icon dell'header."
    )
    pdf.bold_bullet("Tipi:", "article_review, search_complete, publish_success, publish_failed")
    pdf.bold_bullet("Campi:", "type, title, message, entity_type, entity_id, is_read")
    pdf.bold_bullet("Azioni:", "Mark as read (singola o tutte), click per navigare all'entita'")

    pdf.sub_title("Commenti")
    pdf.body_text(
        "Thread di commenti per ogni articolo. Supporta menzioni utente (@user). "
        "I commenti sono ordinati cronologicamente e mostrano avatar utente e timestamp relativo."
    )

    # =========================================================
    # 16. AUTH & RBAC
    # =========================================================
    pdf.section_title("16", "Autenticazione e Ruoli (RBAC)")

    pdf.sub_title("Flusso di Autenticazione")
    pdf.bold_bullet("1. Login:", "POST /api/v1/auth/login con email + password")
    pdf.bold_bullet("2. Token:", "Il server restituisce access_token (30 min) + refresh_token (7 giorni)")
    pdf.bold_bullet("3. Richieste:", "Ogni richiesta include Authorization: Bearer <access_token>")
    pdf.bold_bullet("4. Refresh:", "Quando l'access_token scade, POST /api/v1/auth/refresh con il refresh_token")
    pdf.bold_bullet("5. Logout:", "POST /api/v1/auth/logout revoca il refresh_token (revoked_at) e il frontend pulisce localStorage")

    pdf.sub_title("Gerarchia Ruoli")
    r_h = ["Ruolo", "Livello", "Permessi Principali"]
    r_w = [35, 20, 115]
    pdf.table_header(r_h, r_w)
    roles = [
        ("admin", "5", "Accesso completo, gestione utenti, settings, force status"),
        ("reviewer", "4", "Approva/rifiuta articoli, gestione revisione"),
        ("editor", "3", "Modifica articoli, gestione calendario, pubblicazione"),
        ("contributor", "2", "Crea prompt, esegui ricerche, screening base"),
        ("read_only", "1", "Solo visualizzazione, nessuna modifica"),
    ]
    for i, r in enumerate(roles):
        pdf.table_row(r, r_w, fill=i % 2 == 0)

    pdf.ln(3)
    pdf.sub_title("Sicurezza (Sprint 1 hardening)")
    pdf.bold_bullet("Password utenti:", "bcrypt con salt; policy minima 12 char + blacklist password comuni sui schema UserCreate/UserUpdate")
    pdf.bold_bullet("Token JWT:", "HS256, payload {sub: user_id, role, type, exp}; refresh rotation con jti; revoca su logout")
    pdf.bold_bullet("Config production:", "validator Pydantic rifiuta avvio se SECRET_KEY < 32 char, WP_ENCRYPTION_KEY/ADMIN_PASSWORD ai default, o CORS con localhost in prod")
    pdf.bold_bullet("CORS:", "Configurabile via CORS_ORIGINS; in production vietato localhost/127.0.0.1")
    pdf.bold_bullet("Rate limit (slowapi):", "/auth/login 5/min, /auth/refresh 20/min, /publish/{id} 10/min, /prompts/{id}/run 20/min")
    pdf.bold_bullet("Security headers:", "HSTS (solo prod), CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy")
    pdf.bold_bullet("Cifratura a riposo:", "wp_app_password cifrata con cryptography.fernet; migrazione idempotente delle password legacy in chiaro al lifespan")
    pdf.bold_bullet("Audit log:", "Tabella audit_logs (admin-only via GET /audit-logs): login, login.failed, logout, user.create/update/password_change/role_change/deactivate, wp_config.update")
    pdf.bold_bullet("Admin seed:", "Se ADMIN_PASSWORD e' al default, seed.py genera secrets.token_urlsafe(18) e la stampa UNA SOLA VOLTA nei log")
    pdf.bold_bullet("HTML sanitization:", "bleach lato backend + DOMPurify (componente SafeHTML) lato frontend su ogni contenuto proveniente da fonti esterne")

    # =========================================================
    # 17. SCHEDULER
    # =========================================================
    pdf.section_title("17", "Scheduler e Job in Background")

    pdf.sub_title("APScheduler - Due Job Ricorrenti")

    pdf.bold_bullet("Job 1: check_scheduled_prompts (ogni 5 minuti)",
        "Cerca prompt con schedule_enabled=True e schedule_next_run_at <= now. "
        "Per ognuno esegue run_discovery_pipeline() e aggiorna il prossimo orario.")
    pdf.ln(2)
    pdf.bold_bullet("Job 2: check_publishing_slots (ogni 1 minuto)",
        "Cerca slot con status='scheduled' e scheduled_for <= now. "
        "Per ognuno imposta publishing e chiama publish_to_wordpress().")

    pdf.sub_title("Job Logging")
    pdf.body_text(
        "Ogni esecuzione viene registrata nella tabella job_logs con: "
        "job_type, entity_ref, status (pending/running/completed/failed), "
        "started_at, ended_at, error message, progress percentage."
    )

    # =========================================================
    # 18. API REFERENCE
    # =========================================================
    pdf.section_title("18", "API Reference (Riepilogo Endpoint)")
    pdf.body_text("Tutti gli endpoint sono sotto il prefisso /api/v1/ (eccetto /health).")

    api_groups = [
        ("Autenticazione", [
            ("POST", "/auth/login", "Login utente"),
            ("POST", "/auth/refresh", "Refresh token"),
            ("GET", "/auth/me", "Utente corrente"),
        ]),
        ("Utenti (admin)", [
            ("GET", "/users", "Lista utenti (paginata)"),
            ("POST", "/users", "Crea utente"),
            ("GET/PATCH/DELETE", "/users/{id}", "Dettaglio/modifica/disattiva"),
        ]),
        ("Articoli", [
            ("GET", "/articles", "Lista con filtri avanzati"),
            ("GET", "/articles/{id}", "Dettaglio articolo"),
            ("PATCH", "/articles/{id}", "Modifica articolo"),
            ("POST", "/articles/{id}/status", "Cambia stato"),
            ("GET", "/articles/{id}/transitions", "Transizioni permesse"),
            ("POST", "/articles/batch", "Azioni batch"),
            ("POST", "/articles/{id}/upload-image", "Upload immagine"),
        ]),
        ("Prompt e Ricerche", [
            ("GET/POST", "/prompts", "Lista/Crea prompt"),
            ("GET/PATCH/DELETE", "/prompts/{id}", "Dettaglio/modifica/elimina"),
            ("POST", "/prompts/{id}/run", "Esegui ricerca"),
            ("GET", "/search-runs", "Storico esecuzioni"),
        ]),
        ("Calendario", [
            ("GET/POST", "/slots", "Lista/Crea slot"),
            ("PATCH/DELETE", "/slots/{id}", "Modifica/elimina slot"),
            ("POST", "/slots/check-collision", "Verifica collisioni"),
            ("GET/PATCH", "/slots/rules/{id}", "Regole calendario"),
        ]),
        ("Pubblicazione", [
            ("POST", "/publish/{id}", "Pubblica articolo"),
            ("POST", "/publish/{id}/retry", "Ritenta pubblicazione"),
            ("GET", "/publish-jobs", "Log pubblicazioni"),
        ]),
        ("Tassonomia", [
            ("GET/POST", "/tags", "Lista/Crea tag"),
            ("PATCH/DELETE", "/tags/{id}", "Modifica/elimina tag"),
            ("GET/POST", "/categories", "Lista/Crea categorie"),
            ("PATCH/DELETE", "/categories/{id}", "Modifica/elimina categoria"),
            ("POST", "/taxonomy/sync-wp", "Sync WordPress"),
        ]),
        ("Altro", [
            ("GET", "/dashboard/kpis", "KPI dashboard"),
            ("GET", "/notifications", "Notifiche utente"),
            ("GET/PATCH", "/settings/wordpress", "Config WordPress"),
            ("GET", "/export/articles", "Export CSV/JSON"),
            ("GET", "/health", "Health check"),
        ]),
    ]

    api_h = ["Metodo", "Endpoint", "Descrizione"]
    api_w = [38, 62, 70]
    for group_name, endpoints in api_groups:
        pdf.sub_title(group_name, level=3)
        pdf.table_header(api_h, api_w)
        for i, ep in enumerate(endpoints):
            pdf.table_row(ep, api_w, fill=i % 2 == 0)
        pdf.ln(2)

    # =========================================================
    # 19. FRONTEND UI
    # =========================================================
    pdf.section_title("19", "Frontend - Interfaccia Utente")
    pdf.body_text(
        "Il frontend e' una Single Page Application React completamente localizzata in italiano. "
        "Utilizza Ant Design 5 come libreria di componenti e supporta tutti i workflow dell'editor."
    )

    pdf.sub_title("Pagine Principali")

    pages = [
        ("Dashboard", "Panoramica con 6 KPI (totali, nuovi settimana, in revisione, pianificati, pubblicati, "
         "score medio), pipeline overview, ultimi job e alert."),
        ("Posta in Arrivo (Inbox)", "Tabella articoli con filtri avanzati (stato, lingua, score, dominio), "
         "operazioni batch, preview drawer, paginazione e ordinamento."),
        ("Dettaglio Articolo", "Vista completa: contenuto, immagini, metadati, pannello AI Score, "
         "assegnazione tag/categorie, editor inline, thread commenti."),
        ("Calendario Editoriale", "Viste mese/settimana/giorno con drag & drop dalla sidebar articoli approvati. "
         "Collision detection, schedule modal, timezone Europe/Rome."),
        ("Prompt", "Lista prompt con ricerca e paginazione. Dettaglio con form completo, "
         "cronologia ricerche e pulsante esecuzione immediata."),
        ("Tassonomia", "Gestione tag e categorie con sync WordPress. Vista tabella e vista albero "
         "per categorie gerarchiche. CRUD con sync automatico."),
        ("Impostazioni (admin)", "Configurazione WordPress (URL, credenziali), blacklist domini, "
         "impostazioni scraping e deduplicazione."),
    ]
    for title, desc in pages:
        pdf.bold_bullet(f"{title}:", desc)
        pdf.ln(1)

    pdf.sub_title("Stato Applicazione (Zustand Stores)")
    pdf.bold_bullet("authStore:", "user, accessToken, refreshToken, login(), logout() - persistito in localStorage")
    pdf.bold_bullet("uiStore:", "sidebarCollapsed, locale, toggleSidebar()")
    pdf.bold_bullet("calendarStore:", "viewMode, currentDate, dragState")
    pdf.bold_bullet("notificationStore:", "unreadCount, notifications[], markAsRead(), markAllAsRead()")

    pdf.sub_title("Localizzazione Italiana")
    pdf.body_text(
        "Tutta l'interfaccia e' in italiano: stati ('Importato', 'Vagliato', 'In Revisione', "
        "'Approvato', 'Pianificato', 'Pubblicato', 'Rifiutato'), ruoli ('Amministratore', "
        "'Editore', 'Revisore'), date in formato DD/MM/YY, saluti dinamici "
        "(Buongiorno/Buon pomeriggio/Buonasera)."
    )

    # =========================================================
    # 20. DIAGRAMMA FLUSSO COMPLETO
    # =========================================================
    pdf.section_title("20", "Diagramma di Flusso Completo")
    pdf.body_text(
        "Ecco il diagramma riassuntivo dell'intero flusso, dalla configurazione iniziale "
        "alla pubblicazione finale su WordPress:"
    )

    pdf.code_block(
        "+=====================================================================+\n"
        "|                    GLOBAL SHOPPING INSIGHTS                         |\n"
        "|                  Flusso Completo End-to-End                         |\n"
        "+=====================================================================+\n"
        "\n"
        "  FASE 1: CONFIGURAZIONE                                              \n"
        "  +---------------------+                                             \n"
        "  | Creazione Prompt    |   keywords, lingua, paese, time_depth       \n"
        "  | (Manuale o Sched.)  |   excluded_keywords, max_results            \n"
        "  +----------+----------+                                             \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "  FASE 2: DISCOVERY                                                   \n"
        "  +---------------------+                                             \n"
        "  | DuckDuckGo Search   |   query = description OR keywords           \n"
        "  | (ddgs library)      |   region, timelimit, max_results            \n"
        "  +----------+----------+                                             \n"
        "             |  N risultati URL                                        \n"
        "             v                                                        \n"
        "  FASE 3: SCRAPING (per ogni URL)                                     \n"
        "  +---------------------+                                             \n"
        "  | httpx GET + trafil. |   text, title, author, date, image          \n"
        "  | Content Extraction  |   language, html                            \n"
        "  +----------+----------+                                             \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "  FASE 4: DEDUP + AI SCORING                                          \n"
        "  +---------------------+   Dedup: canonical_url + content_hash       \n"
        "  | sentence-transformers|   Score: cosine_similarity * 1.5           \n"
        "  | all-MiniLM-L6-v2   |   Tags: keyword matching (max 5)            \n"
        "  +----------+----------+   Category: pattern matching                \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "       [status: imported]  -----> Salvato nel Database                \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "  FASE 5: INBOX / SCREENING                                           \n"
        "  +---------------------+                                             \n"
        "  | Filtri + Batch Ops  |   Screening manuale del team editoriale     \n"
        "  | Preview + Actions   |   Promozione a screened o reject            \n"
        "  +----------+----------+                                             \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "       [status: screened]                                             \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "  FASE 6: REVISIONE                                                   \n"
        "  +---------------------+                                             \n"
        "  | Dettaglio Articolo  |   Edit contenuto, assegna tag/categorie     \n"
        "  | AI Panel + Comments |   Revisione con commenti team               \n"
        "  +----------+----------+                                             \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "  [status: in_review] --> [approved] (reviewer/admin)                 \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "  FASE 7: CALENDARIO EDITORIALE                                       \n"
        "  +---------------------+                                             \n"
        "  | Drag & Drop         |   Scegli data/ora pubblicazione             \n"
        "  | Collision Check     |   Verifica max post/giorno                  \n"
        "  +----------+----------+                                             \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "  [status: scheduled] ---> EditorialSlot creato                       \n"
        "             |                                                        \n"
        "     (Scheduler 1min)                                                 \n"
        "             |                                                        \n"
        "             v                                                        \n"
        "  FASE 8: PUBBLICAZIONE WORDPRESS                                     \n"
        "  +---------------------+                                             \n"
        "  | WP REST API         |   POST /wp-json/wp/v2/posts                 \n"
        "  | Upload Media        |   POST /wp-json/wp/v2/media                 \n"
        "  | Basic Auth          |   title, content, tags, categories, image   \n"
        "  +----------+----------+                                             \n"
        "             |                                                        \n"
        "        +----+----+                                                   \n"
        "        |         |                                                   \n"
        "        v         v                                                   \n"
        "  [published] [publish_failed]                                        \n"
        "                  |                                                   \n"
        "                  +--> Retry disponibile                              \n"
        "                                                                      \n"
        "+=====================================================================+"
    )

    return pdf


if __name__ == "__main__":
    pdf = build_pdf()
    out = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "GSI_Documentazione_Tecnica.pdf",
    )
    pdf.output(out)
    print(f"PDF generato: {out}")
