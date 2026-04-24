// ---------------------------------------------------------------------------
// PromptsGuide — guida alle pagine /prompts e /prompts/:id.
// ---------------------------------------------------------------------------
import { Button, Typography, theme as antdTheme } from 'antd';
import {
  ArrowUpRight,
  CalendarClock,
  Filter,
  Folder,
  History,
  Languages,
  PlayCircle,
  Search,
  Settings2,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  ContactFooter,
  Faq,
  GuideDivider as Divider,
  InfoCard,
  SectionTitle,
  Tip,
} from '@/pages/support/components/GuidePrimitives';

const { Paragraph } = Typography;

export default function PromptsGuide() {
  const { token } = antdTheme.useToken();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 820 }}>
      {/* Intro */}
      <SectionTitle icon="🔍">Prompt di ricerca</SectionTitle>
      <Paragraph style={{ fontSize: 14.5, lineHeight: 1.7, color: token.colorText }}>
        Un <strong>prompt</strong> è la ricetta che la pipeline usa per scoprire articoli rilevanti.
        Descrive <em>cosa cercare</em>, <em>in quale lingua</em>,{' '}
        <em>quanto andare indietro nel tempo</em>, e quante URL esaminare. Quando lo esegui, la
        pipeline fa: ricerca DDGS → scrape → scoring AI → filtri → articoli importati nella Inbox.
      </Paragraph>

      <div style={{ marginTop: 18, marginBottom: 28 }}>
        <Button
          type="primary"
          icon={<ArrowUpRight size={14} />}
          onClick={() => navigate('/prompts')}
          style={{
            height: 40,
            borderRadius: 10,
            fontWeight: 600,
            padding: '0 18px',
            background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
            border: 'none',
            boxShadow: '0 4px 12px -2px rgba(114,46,209,0.35)',
          }}
        >
          Vai ai prompt
        </Button>
      </div>

      <Divider />

      {/* Struttura cartelle */}
      <SectionTitle icon={<Folder size={18} />}>Struttura gerarchica a cartelle</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        I prompt sono organizzati in una <strong>gerarchia a 3 livelli</strong> (sidebar sinistra):
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Categorie</strong> (livello 1) — es. Strategy, Customer Journey, Innovation
        </li>
        <li>
          <strong>Sottogruppi</strong> (livello 2) — es. Visione e Leadership, Governance e
          Operazioni
        </li>
        <li>
          <strong>Cartelle prompt</strong> (livello 3) — contengono i prompt veri e propri
        </li>
      </ul>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText, marginTop: 10 }}>
        Click su una cartella → la tabella centrale filtra solo i prompt di quella cartella (e delle
        sue sottocartelle se è di livello alto). La voce{' '}
        <strong>&ldquo;Tutti i prompt&rdquo;</strong> in cima mostra tutto senza filtro;{' '}
        <strong>&ldquo;Senza cartella&rdquo;</strong> mostra i prompt orfani.
      </Paragraph>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorTextSecondary }}>
        Hover su una cartella → menù <em>...</em> per rinominare, creare sottocartella, eliminare.
      </Paragraph>

      <Divider />

      {/* Spostare prompt */}
      <SectionTitle icon="📁">Spostare prompt tra cartelle</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Nella tabella dei prompt, la colonna <strong>Cartella</strong> mostra dove è assegnato
        ciascuno. Due modi per spostarlo:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Click sul pill della cartella</strong> (o &ldquo;Sposta in…&rdquo; se orfano) →
          apre picker con l&rsquo;albero completo + opzione <em>Senza cartella</em>
        </li>
        <li>
          <strong>Bulk</strong>: checkbox a sinistra delle righe → compare toolbar gradient &ldquo;N
          prompt selezionati&rdquo; → <strong>Sposta in cartella</strong> → picker applicato a tutti
        </li>
      </ul>

      <Divider />

      {/* Parametri di un prompt */}
      <SectionTitle icon={<Settings2 size={18} />}>Parametri di un prompt</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Quando crei o modifichi un prompt (click riga → <em>Modifica</em> nel detail):
      </Paragraph>

      <InfoCard
        icon={<Target size={16} />}
        title="Titolo"
        body="Nome leggibile del prompt. Usato nell'UI e nei log."
      />
      <InfoCard
        icon={<Search size={16} />}
        title="Prompt (description)"
        body="La query che verrà mandata a DuckDuckGo. È anche il testo che l'AI confronta col contenuto dell'articolo per lo scoring di rilevanza. Scrivilo in linguaggio naturale, nella lingua target."
      />
      <InfoCard
        icon={<Target size={16} />}
        title="Parole chiave"
        body="Query alternative per DDGS (una per tag). Aiuta a intercettare articoli che usano sinonimi. Opzionale."
      />
      <InfoCard
        icon={<Target size={16} />}
        title="Parole chiave escluse"
        body="Parole che DDGS deve escludere (es. 'gossip' se cerchi retail serio). Applicate come operatori -word."
      />
      <InfoCard
        icon={<Languages size={16} />}
        title="Lingua"
        body="Filtro post-scrape con py3langid. Gli articoli in lingua diversa vengono scartati. Lascia vuoto per non filtrare."
      />
      <InfoCard
        icon={<Languages size={16} />}
        title="Paesi"
        body="Hint geografico per DDGS (regione ricerca). Non un filtro stretto, solo un suggerimento al motore."
      />
      <InfoCard
        icon={<CalendarClock size={16} />}
        title="Arco temporale (time_depth)"
        body="Finestra temporale: 24h, 7d, 30d, 90d, 365d, Tutto. Gli articoli pubblicati prima vengono scartati. Per una raccolta annuale: 365d."
      />
      <InfoCard
        icon={<Target size={16} />}
        title="Risultati massimi"
        body="Budget URL per query DDGS. Default 20. Più alto = più copertura ma più tempo esecuzione. 50 è un buon bilanciamento per il run iniziale; 20-30 per rerun periodici."
      />

      <Tip icon="💡">
        <strong>Regola pratica</strong>: meglio <em>molti prompt specifici</em> con 20-30 risultati
        ciascuno che <em>pochi prompt generici</em> con 200 risultati. Il dedup URL+content-hash
        evita i duplicati fra prompt; la specificità aumenta la pertinenza.
      </Tip>

      <Divider />

      {/* Schedulazione */}
      <SectionTitle icon={<CalendarClock size={18} />}>
        Schedulazione automatica vs lancio manuale
      </SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Ogni prompt ha un toggle <strong>Pianificazione</strong>:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Disattivata</strong> (default): il prompt gira solo quando clicchi{' '}
          <strong>Run</strong> dalla pagina detail.
        </li>
        <li>
          <strong>Attiva con frequenza (ore)</strong>: es. ogni 24 h. APScheduler gira il prompt in
          background.
        </li>
        <li>
          <strong>Attiva con orari specifici</strong>: es. 09:00 + 14:30 + 18:00. Lista di orari
          HH:mm.
        </li>
      </ul>
      <Paragraph
        style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary, marginTop: 8 }}
      >
        Il badge <em>Attiva</em> (verde Play) o <em>Disattivata</em> (grigio Pause) nella tabella
        dei prompt indica lo stato di pianificazione.
      </Paragraph>

      <Divider />

      {/* Run */}
      <SectionTitle icon={<PlayCircle size={18} />}>Eseguire una ricerca</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Dalla pagina detail del prompt (<code>/prompts/:id</code>), click sul pulsante{' '}
        <strong>Esegui ricerca</strong>. La pipeline parte come <em>background task</em>:
      </Paragraph>
      <ol style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        <li>
          <strong>DDGS multi-query</strong> — manda description + keyword singole + keyword
          combinate. Dedup URL.
        </li>
        <li>
          <strong>Scrape trafilatura</strong> — estrae testo pulito, titolo, autore, data
          pubblicazione.
        </li>
        <li>
          <strong>Filtri lingua + data</strong> — scarta articoli fuori scope.
        </li>
        <li>
          <strong>AI scoring (embeddings)</strong> — MiniLM confronta description del prompt vs
          testo articolo. Score 0-100, soglia minima 25.
        </li>
        <li>
          <strong>LLM second-opinion</strong> (se Ollama attivo) — Qwen 2.5 3B conferma/scarta con
          spiegazione.
        </li>
        <li>
          <strong>Articoli importati</strong> — finiscono nella Inbox con stato <em>Importato</em>.
        </li>
      </ol>

      <Divider />

      {/* Cronologia */}
      <SectionTitle icon={<History size={18} />}>Cronologia ricerche</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Nella pagina detail, tab <strong>Cronologia ricerche</strong>: elenco di tutte le run di
        quel prompt con statistiche. Click su una riga → drawer laterale con:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Riepilogo</strong>: URL trovati, articoli creati, duplicati, filtrati per
          lingua/data/rilevanza, errori
        </li>
        <li>
          <strong>Tabella Risultati</strong>: ogni URL scoperto con titolo, dominio e{' '}
          <strong>Score AI</strong> dell&rsquo;articolo collegato (verde ≥70, arancio ≥40, rosso
          &lt;40, — se filtrato)
        </li>
      </ul>
      <Paragraph
        style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary, marginTop: 8 }}
      >
        Serve per debuggare un prompt: se vedi &ldquo;82 URL trovati / 0 articoli creati&rdquo; e{' '}
        <em>Filtro Lingua: 82</em>, capisci che la lingua impostata è errata rispetto alla
        description.
      </Paragraph>

      <Divider />

      {/* Filtri lista */}
      <SectionTitle icon={<Filter size={18} />}>Filtri nella lista prompt</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        In cima alla tabella dei prompt c&rsquo;è una barra di ricerca testuale (cerca nel titolo).
        La sidebar a sinistra fa da filtro per cartella.
      </Paragraph>

      <Divider />

      {/* FAQ */}
      <SectionTitle icon="❓">Situazioni tipiche</SectionTitle>
      <Faq
        q="Ho creato un prompt ma non trova niente"
        a="Apri la cronologia della run e guarda i contatori. URL trovati = 0 → DDGS non restituisce nulla, description troppo specifica (prova a semplificare). URL trovati > 0 ma articoli = 0 → controlla i contatori Filtro Lingua/Data: probabilmente la lingua del prompt non corrisponde a quella degli articoli trovati, oppure time_depth è troppo stretto."
      />
      <Faq
        q="Stesso prompt, 2 lingue diverse — conviene?"
        a="Sì, se vuoi coprire contenuti in italiano ed inglese. Crea 2 prompt con stessa description ma language='it' e 'en'. Il dedup URL+hash evita comunque i duplicati fra loro."
      />
      <Faq
        q="Come faccio a capire se il prompt è troppo generico?"
        a="Se nella cronologia vedi 'Filtro Rilevanza' alto (cioè molti articoli scartati dall'embedding score) → description troppo generica, la pipeline trova URL ma non sono on-topic. Restringi la description o aggiungi keyword più specifiche."
      />
      <Faq
        q="Voglio cambiare max_results su 50 prompt insieme"
        a={
          <>
            Al momento solo tramite API o SQL diretto. Esempio:{' '}
            <code>UPDATE prompts SET max_results = 30 WHERE folder_id IN (...);</code> Nel roadmap:
            bulk-edit dal frontend.
          </>
        }
      />

      <ContactFooter />
    </div>
  );
}
