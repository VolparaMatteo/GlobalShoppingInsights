// ---------------------------------------------------------------------------
// CalendarPage — versione "Coming Soon" temporanea.
//
// Il calendario editoriale completo (DnD + MonthView/WeekView/DayView + modali)
// è preservato in `_CalendarPage.full.tsx` e può essere riattivato al bisogno:
// basta sostituire l'import nel router (o rinominare questo file).
// ---------------------------------------------------------------------------
import { Button, Typography, theme as antdTheme } from 'antd';
import {
  ArrowUpRight,
  CalendarClock,
  Inbox as InboxIcon,
  Rocket,
  Search,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function CalendarPage() {
  const { token } = antdTheme.useToken();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: '56px 48px 52px',
          textAlign: 'center',
          background:
            'linear-gradient(135deg, rgba(22,119,255,0.10) 0%, rgba(114,46,209,0.10) 100%)',
          border: `1px solid ${token.colorPrimary}1f`,
        }}
      >
        {/* Orb decorativi */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -100,
            right: -80,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22,119,255,0.22) 0%, rgba(22,119,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(114,46,209,0.22) 0%, rgba(114,46,209,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Icon badge */}
          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 20px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              color: '#ffffff',
              boxShadow: '0 14px 40px -8px rgba(114,46,209,0.45)',
            }}
          >
            <CalendarClock size={34} strokeWidth={2} />
          </div>

          {/* Badge Coming Soon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              marginBottom: 18,
              background: token.colorBgContainer,
              border: `1px solid ${token.colorPrimary}33`,
              fontSize: 12,
              fontWeight: 600,
              color: token.colorPrimary,
              letterSpacing: 0.3,
            }}
          >
            <Sparkles size={12} strokeWidth={2.4} />
            Coming Soon
          </div>

          <Title
            level={2}
            style={{
              margin: 0,
              fontWeight: 700,
              letterSpacing: -0.6,
              color: token.colorText,
              fontSize: 34,
              lineHeight: 1.2,
            }}
          >
            Calendario editoriale
          </Title>

          <Text
            style={{
              display: 'block',
              margin: '14px auto 0',
              maxWidth: 560,
              fontSize: 15,
              color: token.colorTextSecondary,
              lineHeight: 1.6,
            }}
          >
            Stiamo lavorando sugli ultimi dettagli. Presto la piattaforma sarà live con la
            pianificazione drag &amp; drop degli articoli approvati: viste mese / settimana /
            giorno, gestione collisioni e slot ricorrenti.
          </Text>

          {/* Mini timeline di feature in arrivo */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 10,
              marginTop: 24,
            }}
          >
            {[
              'Drag & drop',
              'Vista mese',
              'Vista settimana',
              'Vista giorno',
              'Slot ricorrenti',
            ].map((label) => (
              <span
                key={label}
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  color: token.colorTextSecondary,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* CTA back to work */}
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'center',
            }}
          >
            <Button
              type="primary"
              icon={<InboxIcon size={14} />}
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
            <Button
              icon={<Search size={14} />}
              onClick={() => navigate('/prompts')}
              style={{
                height: 40,
                borderRadius: 10,
                fontWeight: 500,
                padding: '0 16px',
              }}
            >
              Gestisci i prompt
            </Button>
          </div>
        </div>
      </div>

      {/* Footer card */}
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
          <Rocket size={18} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Text strong style={{ fontSize: 13, color: token.colorText }}>
            Hai fretta?
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Nel frattempo puoi rivedere e approvare articoli nella Inbox; verranno pianificati
              automaticamente appena il calendario sarà attivo.
            </Text>
          </div>
        </div>
        <ArrowUpRight size={16} color={token.colorTextTertiary} />
      </div>
    </div>
  );
}
