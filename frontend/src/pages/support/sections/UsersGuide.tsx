// ---------------------------------------------------------------------------
// UsersGuide — guida alla gestione utenti e ruoli (/settings → Utenti).
// ---------------------------------------------------------------------------
import { Typography, theme as antdTheme } from 'antd';
import { Ban, KeyRound, ShieldCheck, UserCog, UserPlus, Users } from 'lucide-react';

import { ROLE_LABELS, ROLES } from '@/config/constants';
import {
  ContactFooter,
  Faq,
  GuideDivider as Divider,
  InfoCard,
  SectionTitle,
  Tip,
} from '@/pages/support/components/GuidePrimitives';

const { Paragraph, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  admin: '#cf1322',
  editor: '#1677ff',
  reviewer: '#faad14',
  contributor: '#52c41a',
  read_only: '#8c8c8c',
};

const ROLE_PERMISSIONS: Record<string, string> = {
  admin:
    'Controllo totale: configurazione WordPress, gestione utenti, blacklist domini, scraping policy, lettura audit log, force-change di qualsiasi stato articolo.',
  editor:
    'Crea/edita articoli, tag e categorie, pianifica nel calendario, cambia stati fino ad approved, gestisce prompt di ricerca. Non accede a /settings.',
  reviewer:
    'Legge tutti gli articoli, commenta, sposta lo stato verso approved o rejected, non modifica tag/categorie globali.',
  contributor: 'Importa prompt, esegue ricerche, può marcare articoli come screened o rejected.',
  read_only: 'Accesso in sola lettura a dashboard, inbox, articoli. Nessuna azione di scrittura.',
};

export default function UsersGuide() {
  const { token } = antdTheme.useToken();

  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle icon={<Users size={20} />}>Utenti e ruoli</SectionTitle>
      <Paragraph style={{ fontSize: 14.5, lineHeight: 1.7, color: token.colorText }}>
        GSI ha un sistema di accesso basato su 5 ruoli gerarchici. Solo gli <strong>admin</strong>{' '}
        possono creare/modificare/disattivare utenti, dalla sezione <code>/settings</code> →{' '}
        <strong>Utenti</strong>.
      </Paragraph>

      <Divider />

      <SectionTitle icon={<ShieldCheck size={18} />}>I 5 ruoli</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Dal più permissivo al meno permissivo. Ogni ruolo eredita implicitamente le capacità dei
        ruoli inferiori.
      </Paragraph>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {ROLES.map((role) => (
          <div
            key={role}
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: token.colorBgLayout,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderLeft: `3px solid ${ROLE_COLORS[role]}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 6,
                  background: `${ROLE_COLORS[role]}1a`,
                  color: ROLE_COLORS[role],
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                }}
              >
                {ROLE_LABELS[role]}
              </span>
              <Text
                style={{
                  fontSize: 11,
                  color: token.colorTextTertiary,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {role}
              </Text>
            </div>
            <Text style={{ fontSize: 13.5, color: token.colorText, lineHeight: 1.6 }}>
              {ROLE_PERMISSIONS[role]}
            </Text>
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle icon={<UserPlus size={18} />}>Creare un nuovo utente</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        <code>/settings</code> → tab <strong>Utenti</strong> → pulsante{' '}
        <strong>Nuovo utente</strong>. Campi richiesti:
      </Paragraph>

      <InfoCard icon={<UserCog size={16} />} title="Nome" body="Nome e cognome mostrati in UI." />
      <InfoCard
        icon={<UserCog size={16} />}
        title="Email"
        body="Usata per il login + invio notifiche. Deve essere unica: il backend rifiuta se esiste già."
      />
      <InfoCard
        icon={<KeyRound size={16} />}
        title="Password iniziale"
        body="Policy rigorosa: ≥12 caratteri, niente spazi iniziali/finali, niente password comuni ('password1234', 'admin12345678', ecc). Il backend rifiuta con dettaglio."
      />
      <InfoCard
        icon={<ShieldCheck size={16} />}
        title="Ruolo"
        body="Uno dei 5 disponibili. Default: contributor. L'admin può cambiarlo in qualunque momento con Modifica."
      />

      <Tip icon="🔐">
        La password è <strong>hashata con bcrypt</strong> al salvataggio — nemmeno gli admin possono
        vederla in chiaro. Se un utente la dimentica, l&rsquo;admin gliela può <em>reimpostare</em>{' '}
        da <em>Modifica utente</em> (campo opzionale &ldquo;Nuova password&rdquo;).
      </Tip>

      <Divider />

      <SectionTitle icon={<Ban size={18} />}>Disattivare un utente</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Hover sulla riga utente → icona <strong>Ban</strong> (rosso). Conferma modal richiesta.
      </Paragraph>
      <ul style={{ paddingLeft: 22, fontSize: 14, lineHeight: 1.9, color: token.colorText }}>
        <li>
          <strong>Non cancella</strong> l&rsquo;utente dal DB: lo marca <code>is_active=false</code>
        </li>
        <li>Il login successivo fallisce con 401</li>
        <li>La sessione esistente (token JWT) scade naturalmente alla prossima refresh</li>
        <li>
          Per <strong>riattivare</strong>: Modifica utente → pill Stato da <em>Disattivato</em> a{' '}
          <em>Attivo</em>
        </li>
      </ul>
      <Paragraph
        style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary, marginTop: 8 }}
      >
        Tutte le azioni su utenti (create, update, disable, role change) sono loggate in{' '}
        <strong>Registro audit</strong> (/settings → tab omonima) con timestamp, chi ha fatto cosa,
        IP sorgente.
      </Paragraph>

      <Divider />

      <SectionTitle icon="🔒">Come funziona il login</SectionTitle>
      <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: token.colorText }}>
        Flusso autenticazione:
      </Paragraph>
      <ol style={{ paddingLeft: 22, fontSize: 14, lineHeight: 2, color: token.colorText }}>
        <li>
          L&rsquo;utente inserisce email + password in <code>/login</code>
        </li>
        <li>
          Backend verifica email attiva + match bcrypt → ritorna <strong>access_token</strong> (JWT,
          scade 30 min) + <strong>refresh_token</strong> (JWT, scade 7 giorni, memorizzato in DB)
        </li>
        <li>
          Access_token salvato in memoria + localStorage. Incluso in ogni richiesta API come{' '}
          <code>Authorization: Bearer …</code>
        </li>
        <li>
          Alla scadenza, il frontend fa refresh automatico silenzioso via{' '}
          <code>POST /auth/refresh</code>, con <em>rotation</em> (il vecchio refresh token viene
          revocato)
        </li>
        <li>
          <code>POST /auth/logout</code> revoca il refresh token corrente server-side
        </li>
      </ol>
      <Paragraph
        style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorTextSecondary, marginTop: 8 }}
      >
        Rate limit sul login: <strong>5 tentativi / minuto / IP</strong>. Protezione anti
        brute-force.
      </Paragraph>

      <Divider />

      <SectionTitle icon="❓">Situazioni tipiche</SectionTitle>

      <Faq
        q="Un utente ha dimenticato la password"
        a="Admin entra in /settings → Utenti → Modifica → campo 'Nuova password' (12+ caratteri, policy standard) → Salva. L'utente la usa al prossimo login. In roadmap: flusso self-service di reset via email (ora admin-only)."
      />
      <Faq
        q="Voglio creare un account di test/demo read-only"
        a="Ruolo read_only → può accedere a dashboard, inbox, articoli in sola lettura. Non può commentare, editare, cambiare stati. Ottimo per demo al cliente."
      />
      <Faq
        q="Un editor si è dimesso, cosa faccio"
        a="Disattivalo (non cancellare!). Così mantieni traccia delle sue azioni passate (audit log, revisioni articoli). Se serve, cambia anche il suo ruolo a read_only PRIMA di disattivarlo per ridurre i permessi nel frattempo."
      />
      <Faq
        q="Troppi admin, voglio degradarli"
        a="Modifica utente → cambia ruolo. Cambio role istantaneo al prossimo refresh del token. Non serve logout forzato, ma può farlo in sessione corrente finché l'access token non scade (max 30 min)."
      />

      <ContactFooter />
    </div>
  );
}
