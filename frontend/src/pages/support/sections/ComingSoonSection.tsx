// ---------------------------------------------------------------------------
// ComingSoonSection — placeholder per le sezioni di guida non ancora scritte.
// ---------------------------------------------------------------------------
import { Typography, theme as antdTheme } from 'antd';
import { Sparkles } from 'lucide-react';

const { Title, Text } = Typography;

interface ComingSoonSectionProps {
  label: string;
}

export default function ComingSoonSection({ label }: ComingSoonSectionProps) {
  const { token } = antdTheme.useToken();

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '56px 20px',
        maxWidth: 540,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          margin: '0 auto 18px',
          borderRadius: 16,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, rgba(22,119,255,0.14) 0%, rgba(114,46,209,0.14) 100%)',
          border: `1px solid ${token.colorPrimary}33`,
          color: token.colorPrimary,
        }}
      >
        <Sparkles size={28} strokeWidth={2} />
      </div>
      <Title
        level={4}
        style={{ margin: 0, fontWeight: 700, color: token.colorText, letterSpacing: -0.3 }}
      >
        Guida a &ldquo;{label}&rdquo; in arrivo
      </Title>
      <Text
        type="secondary"
        style={{ display: 'block', marginTop: 8, fontSize: 14, lineHeight: 1.6 }}
      >
        Stiamo scrivendo la documentazione completa per questa sezione. Nel frattempo puoi
        consultare la guida della <strong>Inbox editoriale</strong> — le funzionalità trasversali
        (workflow stati, filtri, azioni multiple) sono spiegate lì.
      </Text>
    </div>
  );
}
