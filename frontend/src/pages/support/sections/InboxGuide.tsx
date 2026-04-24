// ---------------------------------------------------------------------------
// InboxGuide — guida all'uso della pagina /inbox.
// Usa tutti i badge/pill reali della piattaforma per far vedere la stessa
// terminologia che l'utente vede nell'app.
// ---------------------------------------------------------------------------
import { Button, Typography, theme as antdTheme } from 'antd';
import {
  ArrowUpRight,
  CheckCheck,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Gauge,
  Globe2,
  Keyboard,
  ListChecks,
  MousePointerClick,
  Search as SearchIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ScoreBadge from '@/components/common/ScoreBadge';
import StatusBadge from '@/components/common/StatusBadge';
import { MANUAL_ARTICLE_STATUSES } from '@/config/constants';
import {
  Arrow,
  ContactFooter,
  Faq,
  GuideDivider as Divider,
  InfoCard as FilterCard,
  Kbd,
  SectionTitle,
  Tip,
} from '@/pages/support/components/GuidePrimitives';

const { Paragraph } = Typography;

export default function InboxGuide() {
  const { token } = antdTheme.useToken();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 820 }}>
      {/* Intro */}
      <SectionTitle icon="📥">La Inbox editoriale</SectionTitle>
      <Paragraph style={{ fontSize: 14.5, lineHeight: 1.7, color: token.colorText }}>
        La <strong>Inbox</strong> è dove atterrano tutti gli articoli scoperti dalla pipeline di
        ricerca automatica. È il cuore del flusso editoriale: qui filtri, valuti, smisti e prepari
        gli articoli per la pubblicazione.
      </Paragraph>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorTextSecondary }}>
        Ogni articolo ha uno <em>stato</em> che indica a che punto del workflow si trova. Tu come
        editor hai il controllo dei 4 stati manuali — gli altri sono automatici.
      </Paragraph>
      <div style={{ marginTop: 18, marginBottom: 28 }}>
        <Button
          type="primary"
          icon={<ArrowUpRight size={14} />}
          onClick={() => navigate('/inbox')}
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
          Vai alla Inbox
        </Button>
      </div>

      <Divider />

      {/* Workflow */}
      <SectionTitle icon="🔀">Il workflow degli stati</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Un articolo entra con stato <StatusBadge status="imported" /> e percorre (o esce da) il
        seguente flusso fino alla pubblicazione:
      </Paragraph>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          padding: '18px 20px',
          background: token.colorBgLayout,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          marginTop: 14,
          marginBottom: 22,
        }}
      >
        <StatusBadge status="imported" size="lg" />
        <Arrow />
        <StatusBadge status="screened" size="lg" />
        <Arrow />
        <StatusBadge status="in_review" size="lg" />
        <Arrow />
        <StatusBadge status="approved" size="lg" />
        <Arrow />
        <StatusBadge status="scheduled" size="lg" />
        <Arrow />
        <StatusBadge status="published" size="lg" />
      </div>

      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        <strong>I 4 stati che puoi impostare manualmente</strong> dalla UI (dropdown &ldquo;Cambia
        stato&rdquo; sia singolo che bulk):
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        {MANUAL_ARTICLE_STATUSES.map((s) => (
          <li key={s}>
            <StatusBadge status={s} /> — {STATUS_HINTS[s]}
          </li>
        ))}
      </ul>
      <Paragraph
        style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary, marginTop: 10 }}
      >
        Gli altri stati sono <strong>automatici</strong>: <StatusBadge status="scheduled" /> (si
        imposta quando trascini l&rsquo;articolo nel Calendario),{' '}
        <StatusBadge status="publishing" /> / <StatusBadge status="published" /> /{' '}
        <StatusBadge status="publish_failed" /> (li gestisce il worker di pubblicazione WordPress).
      </Paragraph>

      <Divider />

      {/* Filtri */}
      <SectionTitle icon={<Filter size={18} />}>I filtri</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        La barra filtri in cima alla Inbox permette di restringere la vista a gruppi specifici di
        articoli. I filtri sono <strong>combinabili</strong>: puoi cercare &ldquo;articoli in
        revisione, in inglese, dominio thedrum.com, score ≥60&rdquo; con un click.
      </Paragraph>

      <FilterCard
        icon={<SearchIcon size={16} />}
        title="Cerca per titolo o contenuto"
        body="Campo testuale libero. Cerca nel titolo e nel testo estratto dall'articolo. Supporta parole singole o frasi."
      />
      <FilterCard
        icon={<ListChecks size={16} />}
        title="Stato"
        body="Seleziona uno o più dei 4 stati manuali (Visualizzato / In Revisione / Approvato / Scartato). Lascia vuoto per vedere tutto."
      />
      <FilterCard
        icon={<Globe2 size={16} />}
        title="Lingua"
        body="Filtra per lingua rilevata dallo scraper (it, en, fr, de, ecc). Utile se gestisci pipeline multilingua."
      />
      <FilterCard
        icon={<Globe2 size={16} />}
        title="Paese"
        body="Paese di origine del contenuto (quando dichiarato dal prompt di ricerca che l'ha trovato)."
      />
      <FilterCard
        icon={<ExternalLink size={16} />}
        title="Dominio"
        body="Dominio della fonte (es. 'forbes.com'). Utile per escludere/includere testate specifiche."
      />
      <FilterCard
        icon={<SlidersHorizontal size={16} />}
        title="Punteggio AI (range slider)"
        body="Filtra per intervallo di score dell'AI relevance (0-100). La raccomandazione dominante: focalizzati su score ≥ 60 per i primi round di triage."
      >
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <ScoreBadge score={90} variant="pill" size="md" />
          <ScoreBadge score={65} variant="pill" size="md" />
          <ScoreBadge score={35} variant="pill" size="md" />
          <ScoreBadge score={10} variant="pill" size="md" />
        </div>
      </FilterCard>

      <Tip>
        Il pulsante <strong>Pulisci</strong> in fondo alla barra azzera tutti i filtri in un click.
      </Tip>

      <Divider />

      {/* Tabella */}
      <SectionTitle icon={<FileText size={18} />}>La tabella degli articoli</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Ogni riga è un articolo importato. Le colonne sono:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Titolo</strong> — il titolo estratto dall&rsquo;articolo.
        </li>
        <li>
          <strong>Fonte</strong> — dominio della pagina originale.
        </li>
        <li>
          <strong>Lingua</strong> — codice ISO 2 lettere (IT / EN / FR …).
        </li>
        <li>
          <strong>Stato</strong> — dove si trova nel workflow (badge colorato).
        </li>
        <li>
          <strong>Punteggio AI</strong> — score 0-100 (più alto = più rilevante). Pill verde per
          ≥75, blu 50-74, arancione 25-49, rosso &lt;25.
        </li>
        <li>
          <strong>Pubblicato</strong> — data di pubblicazione della fonte originale.
        </li>
        <li>
          <strong>Importato</strong> — data in cui la pipeline l&rsquo;ha scoperto.
        </li>
      </ul>

      <Paragraph
        style={{ marginTop: 14, fontSize: 14, lineHeight: 1.7, color: token.colorTextSecondary }}
      >
        <strong>Click su una riga</strong> apre il preview drawer a destra. Le intestazioni sono
        ordinabili: click sulla freccia nell&rsquo;header della colonna per ordinare asc/desc.
      </Paragraph>

      <Divider />

      {/* Preview drawer */}
      <SectionTitle icon={<MousePointerClick size={18} />}>
        Il preview drawer (anteprima articolo)
      </SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Cliccando una riga si apre il pannello laterale con l&rsquo;anteprima completa:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Header</strong>: titolo, dominio, lingua, data di pubblicazione, link alla fonte
          originale (apre in nuova scheda).
        </li>
        <li>
          <strong>Cambio stato inline</strong>: pill dello stato cliccabile → dropdown con i 4 stati
          manuali.
        </li>
        <li>
          <strong>Analisi AI</strong>: spiegazione testuale del perché l&rsquo;articolo ha preso
          quel punteggio + commento di rilevanza LLM (quando Ollama è attivo).
        </li>
        <li>
          <strong>Prompt sorgente</strong>: quale prompt di ricerca l&rsquo;ha trovato (cliccabile
          per andare al suo detail).
        </li>
        <li>
          <strong>Tag &amp; Categorie</strong>: tag correnti + aggiunta inline con select multiplo.
        </li>
        <li>
          <strong>Copertina</strong>: immagine feature. Puoi caricarne una tua, cercarla su Unsplash
          o rimuoverla.
        </li>
        <li>
          <strong>Anteprima contenuto</strong>: primi 800 caratteri del testo estratto. Se
          l&rsquo;articolo non è in italiano, il pulsante <em>&ldquo;Traduci in italiano&rdquo;</em>{' '}
          mostra una traduzione automatica del titolo e del testo.
        </li>
        <li>
          <strong>Footer</strong>: pulsante &ldquo;Cambia stato&rdquo; + link{' '}
          <em>Dettaglio completo</em> per aprire la pagina <code>/articles/:id</code> (editor
          completo).
        </li>
      </ul>

      <Divider />

      {/* Bulk actions */}
      <SectionTitle icon={<CheckCheck size={18} />}>Azioni multiple (bulk)</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Ogni riga ha una checkbox a sinistra. Quando selezioni 1 o più articoli, appare in basso una{' '}
        <strong>barra fluttuante</strong> (gradient blu-viola) con:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Contatore</strong> &ldquo;N selezionati&rdquo;.
        </li>
        <li>
          <strong>Cambia stato</strong> → dropdown con i 4 stati manuali, applica a tutti i
          selezionati.
        </li>
        <li>
          <strong>Tag</strong> → (in arrivo) aggiunta massiva di tag.
        </li>
        <li>
          <strong>Scarta</strong> → marca come <StatusBadge status="rejected" />. Azione
          distruttiva: chiede conferma esplicita.
        </li>
        <li>
          <strong>Annulla</strong> → deseleziona tutto.
        </li>
      </ul>
      <Paragraph
        style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary, marginTop: 8 }}
      >
        La selezione <strong>si preserva al cambio pagina</strong>: puoi scorrere più pagine
        dell&rsquo;elenco selezionando righe diverse, poi applicare un&rsquo;azione a tutte insieme.
      </Paragraph>

      <Divider />

      {/* Export */}
      <SectionTitle icon={<Download size={18} />}>Esportazione</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Il pulsante <strong>Esporta</strong> in alto a destra esporta gli articoli visibili{' '}
        (rispettando i filtri attivi) in due formati:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>CSV</strong> — foglio di calcolo, 1 riga per articolo. Utile per Excel/Sheets,
          report, backup veloci.
        </li>
        <li>
          <strong>JSON</strong> — tutti i campi (inclusi gli array tag/categorie). Utile per
          integrazioni esterne.
        </li>
      </ul>

      <Divider />

      {/* Best practices */}
      <SectionTitle icon={<Gauge size={18} />}>Come usare la Inbox quotidianamente</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Il flusso consigliato per un triage efficiente, soprattutto quando la pipeline importa molti
        articoli (100+ al giorno):
      </Paragraph>
      <ol style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        <li>
          <strong>Filtra</strong> per stato <StatusBadge status="imported" /> + score{' '}
          <ScoreBadge score={70} variant="pill" size="md" /> &nbsp;in su.
        </li>
        <li>
          <strong>Scorri rapidamente</strong> — click riga → preview drawer → decidi:{' '}
          <StatusBadge status="screened" /> (ha potenziale) o <StatusBadge status="rejected" />.
        </li>
        <li>
          <strong>Secondo round</strong>: filtra <StatusBadge status="screened" /> e decidi quali
          passano a <StatusBadge status="in_review" />.
        </li>
        <li>
          <strong>Revisione finale</strong>: vai sulla pagina <code>/articles/:id</code> (dal
          pulsante &ldquo;Dettaglio completo&rdquo; nel drawer) per editare testo, categorie,
          copertina. Poi imposta <StatusBadge status="approved" />.
        </li>
        <li>
          <strong>Pianifica</strong>: dal Calendario trascina l&rsquo;articolo approvato nel
          giorno/ora di pubblicazione. Lo stato diventa automaticamente{' '}
          <StatusBadge status="scheduled" />.
        </li>
      </ol>

      <Tip icon="🎯">
        <strong>Regola empirica</strong>: se un articolo ti richiede più di 10 secondi per decidere
        se vale la pena, <StatusBadge status="rejected" /> — è sempre meglio perdere un borderline
        che perdere tempo sul prossimo.
      </Tip>

      <Divider />

      {/* Scorciatoie */}
      <SectionTitle icon={<Keyboard size={18} />}>Scorciatoie globali</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        In qualunque pagina della piattaforma:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        <li>
          <Kbd>⌘</Kbd> + <Kbd>K</Kbd> (Mac) o <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> (Win) →{' '}
          <strong>Command palette</strong>: ricerca universale articoli, prompt, utenti + azioni
          rapide.
        </li>
        <li>
          <Kbd>?</Kbd> → apre il cheatsheet completo con tutte le scorciatoie disponibili.
        </li>
        <li>
          <Kbd>⌘</Kbd> + <Kbd>Shift</Kbd> + <Kbd>L</Kbd> → toggle light/dark mode.
        </li>
      </ul>

      <Divider />

      {/* FAQ / problemi comuni */}
      <SectionTitle icon="❓">Situazioni tipiche</SectionTitle>

      <Faq
        q="Ho importato 300 articoli e voglio vedere solo quelli italiani del mese scorso"
        a="Filtri: Lingua = IT, Punteggio ≥60 (opzionale), ordina per colonna Importato decrescente. Se vuoi solo articoli pubblicati nell'ultimo mese, ordina per Pubblicato e scorri finché la data rientra nel range."
      />
      <Faq
        q="Ho scartato un articolo per errore"
        a="Filtra per stato Scartato, click sulla riga, cambia stato a Visualizzato (o Importato direttamente via /articles/:id → Cambia Stato force). Torna visibile nel flusso normale."
      />
      <Faq
        q="Un articolo in inglese non si capisce al volo"
        a={
          <>
            Apri il preview drawer e clicca <em>Traduci in italiano</em>. La traduzione è automatica
            via Ollama LLM, pensata per triage veloce (non è pubblication-ready).
          </>
        }
      />
      <Faq
        q="Voglio lavorare solo sugli articoli di alta qualità"
        a={
          <>
            Filtra per <ScoreBadge score={80} variant="pill" size="md" /> &nbsp;con slider ≥80. Sono
            gli articoli che la pipeline AI considera molto rilevanti rispetto al prompt di ricerca
            che li ha trovati.
          </>
        }
      />
      <Faq
        q="L'articolo mostra contenuto troncato o errato"
        a="Lo scraping non sempre riesce perfettamente (paywall, JavaScript-only pages, layout complessi). Apri il link alla fonte originale dal preview drawer per leggerlo nel contesto completo. Se scarti gli articoli di un dominio ricorrente che non scraperano mai bene, valuta di aggiungerlo alla blacklist in /settings."
      />

      <ContactFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hint discorsivo per ogni stato manuale (in italiano, orientato al perché)
// ---------------------------------------------------------------------------

const STATUS_HINTS: Record<string, string> = {
  screened: "l'ho guardato, ha potenziale, serve ancora valutazione",
  in_review: 'è in valutazione attiva, sto decidendo se promuoverlo',
  approved: 'è pronto per la pianificazione sul calendario',
  rejected: 'non va bene per nulla, fuori dal flusso',
};
