// ---------------------------------------------------------------------------
// CalendarGuide — placeholder (la pagina /calendar è in Coming Soon).
// ---------------------------------------------------------------------------
import { Typography, theme as antdTheme } from 'antd';
import { Calendar as CalendarIcon, CalendarClock, Clock, Layers, Sparkles } from 'lucide-react';

import StatusBadge from '@/components/common/StatusBadge';
import {
  ContactFooter,
  GuideDivider as Divider,
  InfoCard,
  SectionTitle,
  Tip,
} from '@/pages/support/components/GuidePrimitives';

const { Paragraph } = Typography;

export default function CalendarGuide() {
  const { token } = antdTheme.useToken();

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle icon={<CalendarIcon size={20} />}>Calendario editoriale</SectionTitle>
      <Paragraph style={{ fontSize: 14.5, lineHeight: 1.7, color: token.colorText }}>
        La pagina <code>/calendar</code> al momento è in <strong>Coming Soon</strong> —
        l&rsquo;implementazione esiste (drag &amp; drop, viste mese/settimana/giorno, gestione
        collisioni) ma è nascosta mentre completiamo il flow di pubblicazione end-to-end. Qui
        descriviamo come funzionerà quando sarà live.
      </Paragraph>

      <Tip icon="🎬">
        <strong>Come attivarlo quando sarai pronto</strong>: sostituisci l&rsquo;import in{' '}
        <code>frontend/src/router/LazyPages.tsx</code> da <code>CalendarPage</code> a{' '}
        <code>_CalendarPage.full</code>. Rebuild frontend. Tutto il codice è già in{' '}
        <code>pages/calendar/_CalendarPage.full.tsx</code>.
      </Tip>

      <Divider />

      <SectionTitle icon={<Layers size={18} />}>Cosa conterrà</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Layout a 2 colonne:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Sidebar sinistra</strong>: lista articoli con stato{' '}
          <StatusBadge status="approved" /> — <em>draggable</em> verso il calendario
        </li>
        <li>
          <strong>Area principale</strong>: vista calendario (mese / settimana / giorno, commutabile
          da segmented in alto)
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<CalendarClock size={18} />}>
        Come funzionerà la pubblicazione
      </SectionTitle>
      <ol style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        <li>
          Un articolo <StatusBadge status="approved" /> appare nella sidebar
        </li>
        <li>Trascinalo su uno slot orario nel calendario (es. Lunedì 09:00)</li>
        <li>
          Compare il <strong>ScheduleModal</strong> con data e ora pre-compilate → conferma o
          modifica
        </li>
        <li>
          Al salvataggio lo stato dell&rsquo;articolo diventa automaticamente{' '}
          <StatusBadge status="scheduled" />
        </li>
        <li>
          All&rsquo;orario definito, lo scheduler interno (APScheduler) esegue il publish verso
          WordPress: <StatusBadge status="scheduled" /> → <StatusBadge status="publishing" /> →{' '}
          <StatusBadge status="published" /> (o <StatusBadge status="publish_failed" /> se qualcosa
          va storto)
        </li>
        <li>
          Se <StatusBadge status="publish_failed" />, puoi ripianificare semplicemente trascinandolo
          di nuovo in un altro slot (stato torna a <StatusBadge status="scheduled" />)
        </li>
      </ol>

      <Divider />

      <SectionTitle icon={<Clock size={18} />}>Gestione collisioni</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Se trascini un articolo su uno slot già occupato da un altro scheduled, appare un{' '}
        <strong>CollisionModal</strong> che mostra gli articoli esistenti in quel slot e ti chiede
        conferma. Puoi:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Confermare</strong> — entrambi gli articoli convivono nello stesso slot (WP non
          impone esclusività)
        </li>
        <li>
          <strong>Annullare</strong> — scegli uno slot diverso
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<Sparkles size={18} />}>Feature in arrivo</SectionTitle>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Slot ricorrenti</strong> (es. &ldquo;ogni lunedì alle 09&rdquo;) — schedulazione
          template riutilizzabili
        </li>
        <li>
          <strong>Preview articolo</strong> al hover sul calendar chip
        </li>
        <li>
          <strong>Export iCal</strong> del planning editoriale
        </li>
        <li>
          <strong>Conflict detection</strong> basato su categoria/tag (evita pubblicare 2 articoli
          simili ravvicinati)
        </li>
      </ul>

      <InfoCard
        icon={<Clock size={16} />}
        title="Timezone"
        body="Gli slot sono salvati in UTC nel DB. Il calendario rende nel fuso del browser dell'utente. WordPress riceve il timestamp in formato ISO-8601 con timezone esplicito."
      />

      <div
        style={{
          marginTop: 24,
          padding: '18px 22px',
          borderRadius: 12,
          border: `1px dashed ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            color: token.colorPrimary,
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Paragraph
            style={{
              margin: 0,
              fontSize: 13.5,
              color: token.colorText,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            Nel frattempo
          </Paragraph>
          <Paragraph
            style={{
              margin: 0,
              fontSize: 12.5,
              color: token.colorTextSecondary,
              lineHeight: 1.6,
            }}
          >
            Concentrati sul triage in Inbox e sulla revisione degli articoli. Quando il calendario
            andrà live, tutti gli articoli approved saranno già pronti per essere pianificati.
          </Paragraph>
        </div>
      </div>

      <ContactFooter />
    </div>
  );
}
