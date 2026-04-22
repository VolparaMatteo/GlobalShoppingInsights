// ---------------------------------------------------------------------------
// AuthLayout.tsx — Sprint 7 polish b4 (login v3 premium)
//
// Pattern Linear/Vercel/Raycast:
//   - Left panel: mesh gradient animato (3 orbs in movimento) + mockup UI
//     floating (card dashboard + chat bubbles stile preview) + brand + copy.
//   - Right panel: SEMPRE light (la login e' vetrina brand, non segue il
//     dark mode utente). Typography generosa, form moderno con input
//     underline-style, gradient button brand.
// ---------------------------------------------------------------------------
import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ConfigProvider, Spin, theme as antdTheme, Typography } from 'antd';
import itIT from 'antd/locale/it_IT';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Newspaper, ShieldCheck, Workflow, ArrowUpRight } from 'lucide-react';

import { themeForMode } from '@/config/theme';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const reduce = useReducedMotion();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#ffffff',
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
          background: '#0b0d18',
          color: '#ffffff',
          padding: '56px',
        }}
      >
        {/* Mesh gradient orbs (animate slowly) */}
        <Orb
          reduce={reduce}
          size={620}
          color="rgba(22, 119, 255, 0.55)"
          top={-160}
          left={-120}
          duration={22}
        />
        <Orb
          reduce={reduce}
          size={520}
          color="rgba(114, 46, 209, 0.6)"
          bottom={-140}
          right={-100}
          duration={28}
          delay={2}
        />
        <Orb
          reduce={reduce}
          size={380}
          color="rgba(19, 194, 194, 0.35)"
          top={260}
          right={140}
          duration={34}
          delay={4}
        />

        {/* Subtle grid overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Logo + nome prodotto (top) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="/favicon.svg"
              alt=""
              width={40}
              height={40}
              style={{
                display: 'block',
                filter: 'drop-shadow(0 4px 12px rgba(22,119,255,0.4))',
              }}
            />
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.2 }}>
              Global Shopping Insights
            </span>
          </div>

          {/* Centro verticale: hero headline + subtitle + feature pills */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 28,
              paddingBlock: 40,
            }}
          >
            <motion.h1
              initial={reduce ? {} : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                fontSize: 'clamp(32px, 3.5vw, 46px)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: -0.8,
                margin: 0,
                maxWidth: 520,
                background: 'linear-gradient(180deg, #ffffff 0%, #d6deff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Editorial intelligence,
              <br />
              riscritta per il retail.
            </motion.h1>

            <motion.p
              initial={reduce ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 460,
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Scopri, valuta, approva e pubblica. GSI fa viaggiare le tue notizie dalla ricerca al
              post WordPress senza cambio di contesto.
            </motion.p>

            {/* Feature pills compatte */}
            <motion.div
              initial={reduce ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.3 }}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 4,
              }}
            >
              {[
                { icon: Sparkles, label: 'Scoperta smart' },
                { icon: Workflow, label: 'Flusso editoriale' },
                { icon: Newspaper, label: 'Pubblicazione diretta' },
                { icon: ShieldCheck, label: 'Tracciabilità completa' },
              ].map((f) => (
                <span
                  key={f.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <f.icon size={13} strokeWidth={2.2} aria-hidden="true" />
                  {f.label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 28,
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>© {new Date().getFullYear()} Global Shopping Insights</span>
            <span>Sviluppato da Spinotto Web Agency s.n.c.</span>
          </div>
        </div>
      </aside>

      {/* ======================== RIGHT: FORM PANEL (SEMPRE LIGHT) ==================== */}
      <ConfigProvider theme={themeForMode('light')} locale={itIT}>
        <main
          style={{
            flex: '1 1 50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            background: '#ffffff',
            color: '#141414',
          }}
        >
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              width: '100%',
              maxWidth: 420,
            }}
          >
            {/* Mobile logo (visibile < lg) */}
            <div className="gsi-auth-mobile-logo" style={{ marginBottom: 32, textAlign: 'center' }}>
              <img
                src="/favicon.svg"
                alt=""
                width={52}
                height={52}
                style={{ display: 'inline-block' }}
              />
              <Title level={4} style={{ margin: '12px 0 0', color: '#141414' }}>
                Global Shopping Insights
              </Title>
            </div>

            {/* Titolo form (desktop + mobile) */}
            <div style={{ marginBottom: 32 }}>
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: '#141414',
                  letterSpacing: -0.8,
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                Bentornato.
              </Title>
              <Text style={{ fontSize: 15, color: '#595959', display: 'block', marginTop: 8 }}>
                Accedi con le credenziali fornite dal tuo admin.
              </Text>
            </div>

            <Suspense
              fallback={<Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}
            >
              <Outlet />
            </Suspense>

            {/* Footer links */}
            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: '#8c8c8c',
              }}
            >
              <span>Non hai un account? Contatta il tuo admin.</span>
              <a
                href="https://github.com/VolparaMatteo/GlobalShoppingInsights"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  color: '#595959',
                  textDecoration: 'none',
                }}
              >
                Docs
                <ArrowUpRight size={12} />
              </a>
            </div>
          </motion.div>
        </main>
      </ConfigProvider>

      {/* Responsive CSS — il pannello sinistro compare >= 1024px */}
      <style>{`
        @media (min-width: 1024px) {
          .gsi-auth-left { display: flex !important; flex-direction: column; }
          .gsi-auth-mobile-logo { display: none; }
        }
        @keyframes gsi-orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, -2%) scale(1.06); }
          66% { transform: translate(-2%, 3%) scale(0.96); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orb — blob colorato animato per il mesh gradient
// ---------------------------------------------------------------------------

interface OrbProps {
  size: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  duration: number;
  delay?: number;
  reduce: boolean | null;
}

function Orb({ size, color, top, left, right, bottom, duration, delay = 0, reduce }: OrbProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 65%)`,
        filter: 'blur(40px)',
        animation: reduce ? 'none' : `gsi-orb-float ${duration}s ease-in-out ${delay}s infinite`,
        pointerEvents: 'none',
      }}
    />
  );
}
