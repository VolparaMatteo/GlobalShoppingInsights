// ---------------------------------------------------------------------------
// components/common/PageTransition.tsx — Sprint 7 polish b2
//
// Wrapper che applica fade+slide su ogni cambio di route. Montato in
// MainLayout attorno a <Outlet /> con AnimatePresence.
//
// Rispetta prefers-reduced-motion (framer-motion ha `useReducedMotion()`).
// ---------------------------------------------------------------------------
import type { ReactNode } from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import { MOTION } from '@/theme/tokens';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const reduce = useReducedMotion();

  // Quando reduce=true, rendiamo una transizione praticamente istantanea.
  const duration = reduce ? 0 : MOTION.duration.base / 1000;
  const y = reduce ? 0 : 8;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -y }}
        transition={{
          duration,
          ease: [0.4, 0, 0.2, 1], // standard easing
        }}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
