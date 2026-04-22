// ---------------------------------------------------------------------------
// components/common/LLMStatusBanner.tsx
//
// Banner globale che avvisa l'utente quando il circuit breaker di Ollama
// e' aperto (LLM offline). La pipeline continua a girare, ma solo con gli
// embeddings — il second-opinion LLM e' temporaneamente saltato.
//
// Montato in MainLayout.tsx sopra il Content.
// ---------------------------------------------------------------------------
import { Alert } from 'antd';
import { useHealth } from '@/hooks/queries/useHealth';

export default function LLMStatusBanner() {
  const { data } = useHealth();

  const circuit = data?.checks.ollama_circuit;
  if (!circuit || circuit.state === 'closed') return null;

  const isOpen = circuit.state === 'open';
  const isHalfOpen = circuit.state === 'half_open';

  const message = isOpen
    ? 'LLM (Ollama) temporaneamente offline'
    : 'LLM (Ollama) in prova di riavvio';

  const description = isOpen
    ? `Il servizio di relevance-check AI ha registrato ${circuit.failures} fallimenti consecutivi ed e' stato sospeso. La pipeline di discovery continua a funzionare usando solo gli embeddings; la qualita' del filtering potrebbe essere leggermente inferiore finche' il servizio non si ristabilisce.`
    : "Prossima chiamata in corso per verificare se il servizio e' tornato operativo.";

  return (
    <Alert
      type={isOpen ? 'warning' : 'info'}
      showIcon
      banner
      message={message}
      description={description}
      style={{ marginBottom: 12 }}
      closable={isHalfOpen}
    />
  );
}
