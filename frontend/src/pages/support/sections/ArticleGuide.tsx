// ---------------------------------------------------------------------------
// ArticleGuide — guida alla pagina /articles/:id (dettaglio articolo).
// ---------------------------------------------------------------------------
import { Typography, theme as antdTheme } from 'antd';
import {
  BrainCircuit,
  Clock,
  FileText,
  History,
  Image as ImageIcon,
  MessageSquare,
  Pencil,
  Tags,
} from 'lucide-react';

import ScoreBadge from '@/components/common/ScoreBadge';
import StatusBadge from '@/components/common/StatusBadge';
import {
  ContactFooter,
  Faq,
  GuideDivider as Divider,
  InfoCard,
  SectionTitle,
  Tip,
} from '@/pages/support/components/GuidePrimitives';

const { Paragraph } = Typography;

export default function ArticleGuide() {
  const { token } = antdTheme.useToken();

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle icon="📄">Dettaglio articolo</SectionTitle>
      <Paragraph style={{ fontSize: 14.5, lineHeight: 1.7, color: token.colorText }}>
        La pagina <code>/articles/:id</code> è l&rsquo;editor completo di un articolo. Ci arrivi da
        un click nella Inbox (tab &ldquo;Dettaglio completo&rdquo; nel preview drawer) o da un link
        nella cronologia prompt. È composta da un <strong>hero</strong> con meta + azioni, un{' '}
        <strong>contenuto centrale</strong> (testo o editor), e una <strong>sidebar destra</strong>{' '}
        con metadata + AI score + taxonomy.
      </Paragraph>

      <Divider />

      <SectionTitle icon="🎯">Hero dell&rsquo;articolo</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        La card superiore contiene:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Stato</strong> come pill cliccabile → dropdown con i 4 stati manuali (
          <StatusBadge status="screened" /> <StatusBadge status="in_review" />{' '}
          <StatusBadge status="approved" /> <StatusBadge status="rejected" />
          ). Il cambio è immediato.
        </li>
        <li>
          <strong>Punteggio AI</strong> (<ScoreBadge score={72} variant="pill" size="md" />
          &nbsp;pill a destra) — score di rilevanza.
        </li>
        <li>
          <strong>Titolo</strong> in evidenza.
        </li>
        <li>
          <strong>Meta pills</strong>: dominio (link cliccabile alla fonte), lingua, paese, autore,
          data pubblicazione, data importazione.
        </li>
        <li>
          <strong>Prompt sorgente</strong>: gradient pill con il nome del prompt che ha trovato
          l&rsquo;articolo (click → detail del prompt).
        </li>
        <li>
          <strong>Azioni</strong>: <em>Modifica</em> per editare testo/immagine,{' '}
          <em>Annulla modifiche</em> per uscire dall&rsquo;editor.
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<FileText size={18} />}>Contenuto dell&rsquo;articolo</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Sotto il hero, in modalità <em>lettura</em>, vedi il testo estratto dallo scraper
        (trafilatura) + le immagini trovate nell&rsquo;articolo originale. In modalità{' '}
        <em>modifica</em> (click &ldquo;Modifica&rdquo;), trovi un editor ricco dove puoi:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>Cambiare titolo</li>
        <li>Riscrivere/rifinire il testo (il content originale rimane sempre consultabile)</li>
        <li>Cambiare autore, data pubblicazione, lingua, paese</li>
        <li>
          Salvare → crea una <em>revisione</em>: ogni modifica è versionata (vedi sotto)
        </li>
      </ul>

      <Tip>
        Il contenuto estratto dallo scraping è spesso &ldquo;grezzo&rdquo;: header template,
        navigation, link relativi. In editor elimina quello che non ti serve — il testo finale che
        verrà pubblicato è quello che salvi qui.
      </Tip>

      <Divider />

      <SectionTitle icon={<BrainCircuit size={18} />}>Pannello AI Score</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Nella sidebar destra, la card <strong>AI Score</strong> mostra:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Score finale</strong> (0-100). È il punteggio dominante usato nei filtri Inbox.
        </li>
        <li>
          <strong>Spiegazione</strong>: bullet list con i motivi del punteggio (es. &ldquo;titolo
          contiene 3 keyword rilevanti&rdquo;, &ldquo;testo ha 600 parole on-topic&rdquo;).
        </li>
        <li>
          <strong>Commento LLM</strong> (se Ollama attivo): giudizio discorsivo del modello, dice
          chiaramente se l&rsquo;articolo è rilevante e perché.
        </li>
        <li>
          <strong>Tag e categoria suggeriti dall&rsquo;AI</strong>: proposti da MiniLM basati sul
          testo. Puoi accettarli con 1 click o ignorarli.
        </li>
        <li>
          <strong>Modello e versione</strong>: quale modello ha scorato (es. <em>llm:qwen2.5:3b</em>{' '}
          oppure <em>all-MiniLM-L6-v2</em> se Ollama era offline).
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<Tags size={18} />}>Tag e Categorie</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Card <strong>Taxonomy</strong> nella sidebar. Tag e categorie sono sincronizzati da
        WordPress (pull automatico + al publish vengono inviati con l&rsquo;articolo). Azioni:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Aggiungi tag</strong>: multi-select, autocomplete sui tag esistenti, digita un
          nuovo tag per crearlo al volo (solo admin/editor)
        </li>
        <li>
          <strong>Accetta suggerimenti AI</strong>: bottone rapido per applicare tutti i tag
          suggeriti da MiniLM
        </li>
        <li>
          <strong>Categoria</strong>: 1 sola per articolo, scelta da dropdown
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<ImageIcon size={18} />}>Immagine di copertina</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Card <strong>Metadata</strong>. 3 modi per impostare la copertina:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Upload manuale</strong>: drag &amp; drop o click (JPG/PNG/WebP fino a 20 MB, poi
          Pillow la riscala a max 1600px e la converte in WebP q=85)
        </li>
        <li>
          <strong>Unsplash picker</strong>: cerca Unsplash direttamente dall&rsquo;UI (se{' '}
          <code>UNSPLASH_ACCESS_KEY</code> è configurato in <code>.env.prod</code>)
        </li>
        <li>
          <strong>Rimuovi</strong>: rimuove l&rsquo;associazione (NON cancella il file, resta in
          /uploads per eventuale rollback)
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<MessageSquare size={18} />}>Commenti editoriali</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Sotto il contenuto principale, il thread <strong>Commenti</strong> permette al team di
        lasciare note sull&rsquo;articolo (reviewer, editor). I commenti sono visibili a tutti i
        ruoli che accedono all&rsquo;articolo. Ogni commento mostra autore, data, testo.
      </Paragraph>
      <Paragraph style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary }}>
        Tipicamente: reviewer lascia feedback → editor lo applica → reviewer approva con commento
        &ldquo;ok&rdquo; → stato passa a <StatusBadge status="approved" />.
      </Paragraph>

      <Divider />

      <SectionTitle icon={<History size={18} />}>Cronologia revisioni</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Ogni salvataggio in editor crea una <strong>revisione</strong>. Tab/card{' '}
        <strong>Revisions</strong> mostra:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Data + autore</strong> di ogni revisione
        </li>
        <li>
          <strong>Diff</strong>: confronto tra revisioni (quali campi sono cambiati, preview side by
          side)
        </li>
        <li>
          <strong>Rollback</strong>: ripristina una revisione precedente come corrente
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<Pencil size={18} />}>Flusso editoriale consigliato</SectionTitle>
      <ol style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        <li>
          Arriva dalla Inbox con stato <StatusBadge status="imported" />
        </li>
        <li>
          Leggi il testo scraped, guarda l&rsquo;AI score → decidi: vale la pena? Se sì,{' '}
          <StatusBadge status="screened" />
        </li>
        <li>
          Click &ldquo;Modifica&rdquo;, pulisci il testo, aggiungi tag/categoria, imposta copertina
        </li>
        <li>
          Passa a <StatusBadge status="in_review" /> e tagga il reviewer in un commento
        </li>
        <li>
          Reviewer legge → commenta → edita se serve → mette <StatusBadge status="approved" />
        </li>
        <li>
          L&rsquo;articolo <em>approved</em> è pronto per il calendario editoriale
        </li>
      </ol>

      <Divider />

      <SectionTitle icon="❓">Situazioni tipiche</SectionTitle>

      <Faq
        q="Il testo scraped è incompleto o pieno di spazzatura"
        a="È la natura dello scraping: alcuni siti (paywall, JavaScript-only, layout complessi) non vengono estratti bene. In editor elimina tutto ciò che non serve e, se il problema è ricorrente per quel dominio, valuta di aggiungerlo alla blacklist in /settings → Scraping."
      />
      <Faq
        q="Ho cambiato idea, voglio ripristinare una versione precedente"
        a="Apri la card Revisions, clicca la revisione desiderata → Rollback. Questo crea una nuova revisione con il contenuto precedente (non elimina la storia)."
      />
      <Faq
        q="L'articolo è in inglese e non lo capisco al volo"
        a="Nel preview drawer (da /inbox) c'è il pulsante 'Traduci in italiano' (Ollama LLM). Nella pagina di dettaglio al momento no — ma puoi aprire la fonte originale e tradurla nel browser."
      />
      <Faq
        q="Voglio pubblicarlo immediatamente"
        a={
          <>
            Stato <StatusBadge status="approved" /> → vai in Calendario (quando sarà attivo) e
            trascinalo sullo slot orario desiderato. Lo stato passerà automaticamente a{' '}
            <StatusBadge status="scheduled" />, poi il worker di pubblicazione lo trasforma in{' '}
            <StatusBadge status="published" /> all&rsquo;orario.
          </>
        }
      />

      <ContactFooter />
    </div>
  );
}
