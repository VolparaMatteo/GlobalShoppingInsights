// ---------------------------------------------------------------------------
// AuthLayout.tsx — Sprint 7 polish b3
//
// Split-screen editoriale:
//   - Pannello sinistro (≥lg): brand + value prop + feature highlights con
//     gradient immersivo blu→viola (brand colors) + pattern decorativo.
//   - Pannello destro: form container pulito, dark-mode aware, con motion di
//     entrata.
// Su schermi < 1024px il pannello sinistro si nasconde (full-width form).
// ---------------------------------------------------------------------------
import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin, theme as antdTheme, Typography } from 'antd';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Newspaper, ShieldCheck, Workflow } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const { token } = antdTheme.useToken();
  const reduce = useReducedMotion();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: token.colorBgLayout,
      }}
    >
      {/* ======================== LEFT: BRAND PANEL ======================== */}
      <aside
        className="gsi-auth-left"
        aria-hidden="true"
        style={{
          flex: '1 1 50%',
          display: 'none',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #722ed1 100%)`,
          color: '#ffffff',
          padding: '56px',
        }}
      >
        {/* Pattern decorativo — cerchi concentrici sfumati */}
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            opacity: 0.18,
            pointerEvents: 'none',
          }}
          width="520"
          height="520"
          viewBox="0 0 520 520"
        >
          <defs>
            <radialGradient id="gsi-auth-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="260" cy="260" r="260" fill="url(#gsi-auth-glow)" />
          <circle
            cx="260"
            cy="260"
            r="180"
            stroke="#ffffff"
            strokeWidth="1"
            fill="none"
            opacity="0.25"
          />
          <circle
            cx="260"
            cy="260"
            r="120"
            stroke="#ffffff"
            strokeWidth="1"
            fill="none"
            opacity="0.2"
          />
        </svg>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Logo + nome prodotto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/favicon.svg" alt="" width={44} height={44} style={{ display: 'block' }} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: 0.2 }}>
              Global Shopping Insights
            </span>
          </div>

          {/* Hero headline */}
          <div style={{ marginTop: 'auto', marginBottom: 24 }}>
            <motion.h1
              initial={reduce ? {} : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: -0.5,
                margin: 0,
                maxWidth: 480,
              }}
            >
              Editorial intelligence
              <br />
              per il retail globale.
            </motion.h1>
            <motion.p
              initial={reduce ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                marginTop: 16,
                maxWidth: 440,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              Scopri le notizie che contano, lasciale valutare dall'AI, approva con il tuo team e
              pubblica su WordPress. Tutto in un unico flusso.
            </motion.p>
          </div>

          {/* Feature highlights */}
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: 12,
            }}
          >
            {[
              {
                icon: Sparkles,
                title: 'Discovery con AI',
                text: 'Ricerca automatica + scoring semantico + LLM second-opinion.',
              },
              {
                icon: Workflow,
                title: 'Workflow editoriale',
                text: 'Stati tracciati, ruoli e permessi, calendar drag&drop.',
              },
              {
                icon: Newspaper,
                title: 'Pubblicazione WordPress',
                text: 'Direct publishing con tassonomia sincronizzata e retry automatico.',
              },
              {
                icon: ShieldCheck,
                title: 'Sicurezza enterprise',
                text: 'JWT rotation, rate limit, audit log, Fernet encryption.',
              },
            ].map((f, idx) => (
              <motion.li
                key={f.title}
                initial={reduce ? {} : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + idx * 0.06 }}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <f.icon size={18} strokeWidth={2.2} color="#ffffff" aria-hidden="true" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{f.title}</div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'rgba(255,255,255,0.75)',
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {f.text}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>

          {/* Footer copy */}
          <div style={{ marginTop: 32, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            © {new Date().getFullYear()} GSI · v1.0.0
          </div>
        </div>
      </aside>

      {/* ======================== RIGHT: FORM PANEL ======================== */}
      <main
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
        }}
      >
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: 36,
            background: token.colorBgContainer,
            borderRadius: 16,
            boxShadow: 'var(--shadow-lg)',
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {/* Mobile logo (visibile < lg) */}
          <div className="gsi-auth-mobile-logo" style={{ marginBottom: 24, textAlign: 'center' }}>
            <img
              src="/favicon.svg"
              alt=""
              width={48}
              height={48}
              style={{ display: 'inline-block' }}
            />
            <Title level={4} style={{ margin: '10px 0 0', color: token.colorText }}>
              Global Shopping Insights
            </Title>
          </div>

          {/* Titolo form (desktop) */}
          <div className="gsi-auth-title" style={{ marginBottom: 28 }}>
            <Title level={3} style={{ margin: 0, color: token.colorText, letterSpacing: -0.3 }}>
              Bentornato
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Accedi per continuare a lavorare sulla pipeline editoriale.
            </Text>
          </div>

          <Suspense
            fallback={<Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}
          >
            <Outlet />
          </Suspense>
        </motion.div>
      </main>

      {/* Responsive CSS — il pannello sinistro compare >= 1024px */}
      <style>{`
        @media (min-width: 1024px) {
          .gsi-auth-left { display: flex !important; flex-direction: column; }
          .gsi-auth-mobile-logo { display: none; }
        }
        @media (max-width: 1023px) {
          .gsi-auth-title { text-align: center; }
        }
      `}</style>
    </div>
  );
}
