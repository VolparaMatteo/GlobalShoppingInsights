// ---------------------------------------------------------------------------
// Guide primitives — mini-componenti riusabili da tutte le pagine di /support.
// ---------------------------------------------------------------------------
import type { ReactNode } from 'react';

import { Typography, theme as antdTheme } from 'antd';
import { ArrowRight, Lightbulb } from 'lucide-react';

const { Title, Text } = Typography;

// ---- SectionTitle ----------------------------------------------------------

export function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  const { token } = antdTheme.useToken();
  return (
    <Title
      level={4}
      style={{
        margin: '12px 0 12px',
        fontWeight: 700,
        letterSpacing: -0.3,
        color: token.colorText,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span
        style={{
          fontSize: 20,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
        }}
      >
        {icon}
      </span>
      {children}
    </Title>
  );
}

// ---- Divider ---------------------------------------------------------------

export function GuideDivider() {
  const { token } = antdTheme.useToken();
  return (
    <div
      style={{
        height: 1,
        background: token.colorBorderSecondary,
        margin: '32px 0',
      }}
    />
  );
}

// ---- Arrow (inline) --------------------------------------------------------

export function Arrow() {
  const { token } = antdTheme.useToken();
  return <ArrowRight size={14} color={token.colorTextTertiary} strokeWidth={2.2} />;
}

// ---- Info card (esplica una feature/filtro/opzione) ------------------------

export function InfoCard({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body: ReactNode;
  children?: ReactNode;
}) {
  const { token } = antdTheme.useToken();
  return (
    <div
      style={{
        marginTop: 12,
        padding: '14px 16px',
        background: token.colorBgLayout,
        borderRadius: 10,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
          color: token.colorPrimary,
        }}
      >
        {icon}
        <Text strong style={{ fontSize: 13.5, color: token.colorText }}>
          {title}
        </Text>
      </div>
      <Text style={{ fontSize: 13.5, color: token.colorTextSecondary, lineHeight: 1.6 }}>
        {body}
      </Text>
      {children}
    </div>
  );
}

// ---- Tip (callout giallo con lampadina) ------------------------------------

export function Tip({
  icon = <Lightbulb size={15} />,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  const { token } = antdTheme.useToken();
  return (
    <div
      style={{
        marginTop: 18,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(250,173,20,0.08) 0%, rgba(250,173,20,0.04) 100%)',
        border: `1px solid rgba(250,173,20,0.3)`,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#faad14',
          fontSize: 18,
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        {icon}
      </span>
      <Text style={{ fontSize: 13.5, lineHeight: 1.7, color: token.colorText }}>{children}</Text>
    </div>
  );
}

// ---- Faq (Q domanda + A risposta) ------------------------------------------

export function Faq({ q, a }: { q: string; a: ReactNode }) {
  const { token } = antdTheme.useToken();
  return (
    <div
      style={{
        marginTop: 12,
        padding: '14px 16px',
        background: token.colorBgLayout,
        borderRadius: 10,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Text
        strong
        style={{ fontSize: 13.5, display: 'block', marginBottom: 5, color: token.colorText }}
      >
        {q}
      </Text>
      <Text style={{ fontSize: 13.5, color: token.colorTextSecondary, lineHeight: 1.7 }}>{a}</Text>
    </div>
  );
}

// ---- Kbd (tasto da tastiera) ----------------------------------------------

export function Kbd({ children }: { children: ReactNode }) {
  const { token } = antdTheme.useToken();
  return (
    <kbd
      style={{
        display: 'inline-block',
        padding: '1px 7px',
        fontSize: 12,
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        color: token.colorText,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderBottomWidth: 2,
        borderRadius: 6,
        lineHeight: 1.4,
      }}
    >
      {children}
    </kbd>
  );
}

// ---- ContactFooter (standard a fondo di ogni guida) -----------------------

export function ContactFooter() {
  const { token } = antdTheme.useToken();
  return (
    <div
      style={{
        marginTop: 36,
        padding: '20px 22px',
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(22,119,255,0.08) 0%, rgba(114,46,209,0.08) 100%)',
        border: `1px solid ${token.colorPrimary}33`,
      }}
    >
      <Text strong style={{ fontSize: 14, color: token.colorText, display: 'block' }}>
        Hai altre domande?
      </Text>
      <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.7 }}>
        Scrivimi direttamente a{' '}
        <a href="mailto:matteo@spinottowebagency.com">matteo@spinottowebagency.com</a> — la guida
        viene estesa di continuo in base alle domande che ricevo.
      </Text>
    </div>
  );
}
