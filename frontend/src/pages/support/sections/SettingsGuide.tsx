// ---------------------------------------------------------------------------
// SettingsGuide — guida a /settings (admin-only).
// ---------------------------------------------------------------------------
import { Typography, theme as antdTheme } from 'antd';
import {
  Ban,
  Bot,
  FileClock,
  Fingerprint,
  Globe,
  KeyRound,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  ContactFooter,
  Faq,
  GuideDivider as Divider,
  InfoCard,
  SectionTitle,
  Tip,
} from '@/pages/support/components/GuidePrimitives';

const { Paragraph } = Typography;

export default function SettingsGuide() {
  const { token } = antdTheme.useToken();

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle icon={<Settings2 size={20} />}>Impostazioni di piattaforma</SectionTitle>
      <Paragraph style={{ fontSize: 14.5, lineHeight: 1.7, color: token.colorText }}>
        <code>/settings</code> è la sezione <strong>admin-only</strong> dove configuri
        l&rsquo;integrazione WordPress, le policy di discovery, gli utenti e consulti il log di
        audit. Organizzata in 6 tab.
      </Paragraph>

      <Tip icon="🔒">
        Questa pagina è accessibile solo se il tuo ruolo è <strong>admin</strong>. Gli altri ruoli
        ricevono 403 dal backend. Il <code>RoleGuard</code> lato frontend nasconde anche la voce in
        sidebar.
      </Tip>

      <Divider />

      <SectionTitle icon={<Globe size={18} />}>Tab &ldquo;WordPress&rdquo;</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Configura la connessione al sito WordPress dove verranno pubblicati gli articoli.
      </Paragraph>

      <InfoCard
        icon={<Globe size={16} />}
        title="WordPress URL"
        body="Dominio completo del sito (https://example.com). NO slash finale, NO /wp-admin."
      />
      <InfoCard
        icon={<KeyRound size={16} />}
        title="Username + App Password"
        body="Credenziali di un utente WP con ruolo editor/admin. App Password si genera da WP admin → Profilo → Password applicazione (richiede WordPress 5.6+). La password viene cifrata con Fernet prima di essere salvata in DB."
      />
      <InfoCard
        icon={<Users size={16} />}
        title="Default author ID"
        body="ID WordPress dell'autore di default per gli articoli pubblicati. Puoi override per articolo nel /articles/:id."
      />
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText, marginTop: 10 }}>
        Pulsante <strong>Test connection</strong>: pinga l&rsquo;endpoint WP REST API con le
        credenziali. Se verde ✓, la pubblicazione funzionerà. Se rosso ✗, errore dettagliato
        (network, 401, 403).
      </Paragraph>

      <Divider />

      <SectionTitle icon={<Ban size={18} />}>Tab &ldquo;Blacklist&rdquo;</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Lista di domini da <strong>escludere a priori</strong> dalla pipeline di discovery.
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Aggiungi dominio</strong>: es. <code>spammy-site.com</code>, il match è su{' '}
          <em>dominio + sottodomini</em>
        </li>
        <li>
          <strong>Reason</strong> (opzionale): perché l&rsquo;hai aggiunto (es. &ldquo;paywall
          duro&rdquo;, &ldquo;contenuto AI-generated ripetuto&rdquo;)
        </li>
        <li>
          <strong>Rimuovi</strong>: icona cestino sulla riga
        </li>
      </ul>
      <Paragraph
        style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary, marginTop: 8 }}
      >
        Quando un URL della blacklist appare nei risultati DDGS, viene skippato prima dello scraping
        (nessun impatto sui contatori <em>urls_found</em> del job, ma salta tutto il resto). Non
        cancella articoli già importati da quel dominio.
      </Paragraph>

      <Divider />

      <SectionTitle icon={<Bot size={18} />}>Tab &ldquo;Scraping&rdquo;</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Parametri globali della pipeline di scraping + scoring AI.
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Min relevance score</strong>: soglia sotto la quale gli articoli vengono filtrati
          (default 25 su 100). Alzarlo = meno articoli ma più pertinenti.
        </li>
        <li>
          <strong>Scrape timeout</strong>: secondi max per fetch+extract di un URL (default 30s).
        </li>
        <li>
          <strong>HTTP User-Agent</strong>: stringa UA inviata a DDGS e ai siti. Default è un Chrome
          recente.
        </li>
      </ul>

      <Divider />

      <SectionTitle icon={<Fingerprint size={18} />}>Tab &ldquo;Dedup&rdquo;</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Policy di deduplicazione. GSI usa 2 criteri:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>URL canonico</strong>: normalizzazione (no query params, no fragment, no trailing
          slash) + match esatto
        </li>
        <li>
          <strong>Content hash</strong>: SHA256 del testo estratto — cattura articoli duplicati
          pubblicati da syndication su domini diversi
        </li>
      </ul>
      <Paragraph style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary }}>
        La pagina mostra le statistiche: quanti duplicati sono stati skippati dal sistema. Non ci
        sono parametri editabili qui, solo trasparenza del meccanismo.
      </Paragraph>

      <Divider />

      <SectionTitle icon={<Users size={18} />}>Tab &ldquo;Utenti&rdquo;</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        CRUD utenti con assegnazione ruolo. Dettaglio completo nella{' '}
        <a href="/support/users">guida Utenti e ruoli</a>.
      </Paragraph>

      <Divider />

      <SectionTitle icon={<FileClock size={18} />}>Tab &ldquo;Registro audit&rdquo;</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Log immutabile di tutte le azioni sensibili effettuate sulla piattaforma:
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Login</strong>: successi, falliti (anche per email inesistenti), login su account
          disattivato
        </li>
        <li>
          <strong>Logout</strong>: revoca refresh token
        </li>
        <li>
          <strong>User management</strong>: create, update, password change, role change, deactivate
        </li>
        <li>
          <strong>WP config update</strong>: modifica credenziali WordPress
        </li>
      </ul>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Per ogni evento: timestamp, attore (user_id + email), azione, entità coinvolta, IP sorgente,
        user-agent. Filtri per action/entity/user_id + ordine cronologico desc.
      </Paragraph>
      <Paragraph
        style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary, marginTop: 6 }}
      >
        I log di audit sono <strong>solo append-only</strong>: non si possono modificare né
        cancellare dalla UI.
      </Paragraph>

      <Divider />

      <SectionTitle icon={<ShieldCheck size={18} />}>Best practice</SectionTitle>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        <li>
          <strong>Ruota la app password WordPress</strong> ogni 90 giorni. In WP admin: Profilo →
          Password applicazione → genera nuova → aggiorna in GSI → revoca la vecchia.
        </li>
        <li>
          <strong>Aggiungi domini rumorosi alla blacklist</strong> appena ne trovi uno. Evita di
          sprecare scrape su contenuti non pubblicabili.
        </li>
        <li>
          <strong>Controlla il registro audit mensilmente</strong> — cerca login falliti anomali,
          cambi ruolo inaspettati, create user da IP sospetti.
        </li>
        <li>
          <strong>Non alzare min-score oltre 50</strong> per i primi mesi — rischi di filtrare
          troppo e perdere lead interessanti. Tarati dopo ≥1k articoli valutati.
        </li>
      </ul>

      <Divider />

      <SectionTitle icon="❓">Situazioni tipiche</SectionTitle>

      <Faq
        q="Test connection WordPress torna 401"
        a="App Password errata o scaduta. Vai in WP admin → Profilo → Password applicazione → genera una nuova. Copia la stringa di 4 gruppi da 4 caratteri (spazi inclusi) e incollala in GSI. Test di nuovo."
      />
      <Faq
        q="Voglio disabilitare temporaneamente l'integrazione WP"
        a="Al momento non c'è un toggle. Workaround: svuota il campo URL → la pubblicazione fallirà con messaggio chiaro. Oppure lascia tutto configurato e non schedulare publish."
      />
      <Faq
        q="La blacklist ha 200+ domini, diventa ingestibile"
        a="Considera di aggiungere un parametro 'Max risultati per dominio' (roadmap). Nel frattempo, la via pragmatica è escludere domini aggregatori noti e concentrarsi su fonti di qualità (riviste specializzate, testate con editorial board)."
      />
      <Faq
        q="Come esporto l'audit log per compliance?"
        a={
          <>
            Al momento da DB:{' '}
            <code>docker exec gsi-postgres-prod pg_dump -t audit_logs gsi &gt; audit.sql</code>,
            oppure query SQL custom. Roadmap: bottone export CSV/JSON nella UI.
          </>
        }
      />

      <ContactFooter />
    </div>
  );
}
