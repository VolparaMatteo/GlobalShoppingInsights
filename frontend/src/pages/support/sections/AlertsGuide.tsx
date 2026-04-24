// ---------------------------------------------------------------------------
// AlertsGuide — guida a /dashboard/alerts (storico job_logs).
// ---------------------------------------------------------------------------
import { Button, Typography, theme as antdTheme } from 'antd';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Loader,
  RefreshCw,
  XCircle,
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

export default function AlertsGuide() {
  const { token } = antdTheme.useToken();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle icon={<Bell size={20} />}>Alert e log dei job</SectionTitle>
      <Paragraph style={{ fontSize: 14.5, lineHeight: 1.7, color: token.colorText }}>
        La pagina <code>/dashboard/alerts</code> mostra lo storico di tutte le esecuzioni dello{' '}
        <strong>scheduler interno</strong>: discovery pipeline (ricerca articoli), publishing
        (pubblicazione WordPress), e future integrazioni. È il tuo radar operativo: quando qualcosa
        va storto, qui trovi il &ldquo;perché&rdquo;.
      </Paragraph>

      <div style={{ marginTop: 18, marginBottom: 28 }}>
        <Button
          type="primary"
          icon={<ArrowUpRight size={14} />}
          onClick={() => navigate('/dashboard/alerts')}
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
          Vai ad Alert &amp; log
        </Button>
      </div>

      <Divider />

      <SectionTitle icon="🗂️">Cos&rsquo;è un job_log</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Ogni job in background (discovery di un prompt, publish di un articolo) crea una riga nella
        tabella <code>job_logs</code> con:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Iniziato</strong>: timestamp di avvio (relativo, es. &ldquo;5 minuti fa&rdquo;)
        </li>
        <li>
          <strong>Tipo</strong>: <em>discovery</em> (gradient blu) o <em>publish</em> (gradient
          viola)
        </li>
        <li>
          <strong>Riferimento</strong>: entità legata (es. <code>prompt:42</code>,{' '}
          <code>article:107</code>) — font monospace
        </li>
        <li>
          <strong>Stato</strong>: pending, running, completed, failed
        </li>
        <li>
          <strong>Progresso</strong>: barra 0-100% con gradient brand (per job long-running)
        </li>
        <li>
          <strong>Errore</strong>: messaggio (se status=failed), troncato con tooltip completo
          all&rsquo;hover
        </li>
      </ul>

      <Divider />

      <SectionTitle icon="🚦">Gli stati dei job</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <StatusRow
          icon={<Clock size={14} />}
          color={token.colorTextSecondary}
          bg={token.colorFillQuaternary}
          label="In attesa"
          slug="pending"
          desc="Job in coda, non ancora partito. Lo scheduler lo prenderà al prossimo tick (di solito entro 60s)."
        />
        <StatusRow
          icon={<Loader size={14} style={{ animation: 'gsi-spin 1s linear infinite' }} />}
          color={token.colorPrimary}
          bg={`${token.colorPrimary}14`}
          label="In corso"
          slug="running"
          desc="Job attivo in questo momento. Un discovery tipico dura 30-120s, un publish 5-15s."
        />
        <StatusRow
          icon={<CheckCircle2 size={14} />}
          color={token.colorSuccess}
          bg={`${token.colorSuccess}14`}
          label="Completato"
          slug="completed"
          desc="Finito senza errori. Guarda progresso=100%."
        />
        <StatusRow
          icon={<XCircle size={14} />}
          color={token.colorError}
          bg={`${token.colorError}14`}
          label="Fallito"
          slug="failed"
          desc="Eccezione non recuperabile. Colonna Errore ha il messaggio. Vedi sotto per troubleshooting."
        />
      </div>

      <Divider />

      <SectionTitle icon={<Filter size={18} />}>Filtri</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        In cima alla tabella, 2 filtri:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Stato</strong>: Tutti / In corso / In attesa / Completati / Falliti
        </li>
        <li>
          <strong>Tipo</strong>: Tutti / Discovery / Publish
        </li>
      </ul>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorTextSecondary }}>
        Il pulsante <strong>Aggiorna</strong> in alto a destra (icon <em>RefreshCw</em>) rifrescia
        la tabella. Utile mentre monitori un job long-running — la pagina non fa polling automatico
        (questione di performance: a fine Sprint 4 la scelta è stata refresh manuale).
      </Paragraph>

      <Divider />

      <SectionTitle icon={<AlertTriangle size={18} />}>
        Interpretare gli errori più comuni
      </SectionTitle>

      <InfoCard
        icon={<XCircle size={16} />}
        title='"DDGS search failed: Ratelimit"'
        body="DuckDuckGo ha bloccato temporaneamente le richieste dal VPS. Succede se lanci troppi prompt in parallelo. Mitigazione: aspetta 10-15 min prima di rilanciare; lo script run_all_prompts è sequenziale per questo motivo."
      />
      <InfoCard
        icon={<XCircle size={16} />}
        title='"Scraping failed for https://… : Connection timeout"'
        body="Sito lento o non raggiungibile. La pipeline skippa quell'URL (è conteggiato in 'errori') e prosegue. Non compromette il resto del prompt."
      />
      <InfoCard
        icon={<XCircle size={16} />}
        title='"LLM evaluation failed: circuit open"'
        body="Il circuit breaker di Ollama si apre dopo 3 failure consecutive. Dopo 5 minuti riprova automaticamente. Nel frattempo la pipeline skippa l'LLM step e fa solo lo scoring embedding."
      />
      <InfoCard
        icon={<XCircle size={16} />}
        title='"WordPress publish failed: 401"'
        body="Password applicazione WP scaduta o cambiata. Vai in /settings → WordPress, rigenera l'app password in WP admin, aggiornala in GSI, rilancia."
      />

      <Tip icon="🔍">
        Per dettagli ultra-completi guarda i <strong>container logs</strong> sul VPS:{' '}
        <code>docker compose logs backend --tail 200 | grep ERROR</code>. I job_logs mostrano il
        messaggio sintetico, i container logs hanno lo stacktrace completo + context.
      </Tip>

      <Divider />

      <SectionTitle icon={<RefreshCw size={18} />}>Quando consultare questa pagina</SectionTitle>
      <ol style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        <li>
          <strong>Dopo aver lanciato una ricerca manuale</strong> — conferma visiva che è in corso.
        </li>
        <li>
          <strong>Ogni mattina</strong> — controlla che i job schedulati di notte siano andati a
          buon fine.
        </li>
        <li>
          <strong>Quando un prompt non produce articoli</strong> — qui vedi se ha davvero girato o
          se è ancora in coda.
        </li>
        <li>
          <strong>Prima di una pubblicazione importante</strong> — verifica che non ci siano publish
          falliti pendenti dal giorno prima.
        </li>
        <li>
          <strong>Dopo un restart del backend</strong> — controlla che lo scheduler sia ripartito
          correttamente (dovresti vedere nuovi job discovery nei minuti successivi).
        </li>
      </ol>

      <Divider />

      <SectionTitle icon="❓">Situazioni tipiche</SectionTitle>

      <Faq
        q="Vedo N job 'running' ma la UI è immobile"
        a="Click sul pulsante Aggiorna in alto a destra. La pagina non fa polling automatico. Se dopo 5 min il job è ancora running, probabilmente è davvero un long-running (es. discovery con 50 URL da scrapare); se dopo 15+ min ancora no, controlla i container logs sul VPS."
      />
      <Faq
        q="Un job è stuck in 'running' ma non sta facendo nulla"
        a="Capitato raramente dopo un container crash. Risolvi: restart backend (docker compose restart backend). I job appesi vengono marcati failed al restart. Per i discovery, puoi rilanciare manualmente il prompt."
      />
      <Faq
        q="Ho 100+ job al giorno, la pagina è troppo affollata"
        a="Usa i filtri: Stato=Falliti per vedere solo le criticità, o Tipo=Publish per focalizzarti sui publish. La paginazione è configurabile fino a 100/page."
      />
      <Faq
        q="Voglio un alert via email quando qualcosa fallisce"
        a={
          <>
            Al momento GSI non invia email outbound (il focus è dashboard-centric). Se hai Sentry
            abilitato (variabile <code>SENTRY_DSN</code> in <code>.env.prod</code>), le eccezioni
            finiscono lì e puoi configurare alert email da Sentry stessa.
          </>
        }
      />

      <ContactFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatusRow({
  icon,
  color,
  bg,
  label,
  slug,
  desc,
}: {
  icon: React.ReactNode;
  color: string;
  bg: string;
  label: string;
  slug: string;
  desc: string;
}) {
  const { token } = antdTheme.useToken();
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: token.colorBgLayout,
        border: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 9px',
          fontSize: 12,
          fontWeight: 500,
          color,
          background: bg,
          border: `1px solid ${color}33`,
          borderRadius: 6,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {icon}
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: token.colorTextTertiary,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            marginBottom: 2,
          }}
        >
          {slug}
        </div>
        <div style={{ fontSize: 13.5, color: token.colorText, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}
