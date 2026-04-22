// ---------------------------------------------------------------------------
// utils/errorToast.ts  --  AxiosError -> toast message specifico
// ---------------------------------------------------------------------------
//
// Centralizza la mappatura degli errori HTTP/rete in messaggi user-friendly
// in italiano. Evita il "generic 500" che lascia l'utente senza contesto.
//
// Uso:
//   import { toastFromError } from '@/utils/errorToast';
//   mutation.mutate(..., { onError: toastFromError });
// ---------------------------------------------------------------------------

import { AxiosError } from 'axios';
import { message } from 'antd';

interface ApiErrorDetail {
  detail?: string | { msg?: string }[];
  message?: string;
}

/**
 * Estrae il messaggio piu' parlante possibile da un AxiosError e mostra
 * un toast antd. Ritorna la stringa usata (utile per logging).
 */
export function toastFromError(err: unknown): string {
  const text = describeError(err);
  message.error(text);
  return text;
}

/**
 * Pura (no side effect): mappa un errore a una stringa user-friendly IT.
 */
export function describeError(err: unknown): string {
  if (!(err instanceof AxiosError)) {
    if (err instanceof Error) return err.message;
    return 'Errore imprevisto';
  }

  // ---- Rete (no response) ------------------------------------------------
  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return 'Timeout: il server non ha risposto in tempo. Riprova tra qualche istante.';
  }
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Impossibile contattare il server. Controlla la connessione e riprova.';
  }

  const status = err.response.status;
  const data = err.response.data as ApiErrorDetail | undefined;
  const serverMsg = extractServerMessage(data);

  // ---- Codici HTTP specifici --------------------------------------------
  switch (status) {
    case 400:
      return serverMsg || 'Richiesta non valida.';
    case 401:
      return 'Sessione scaduta. Effettua di nuovo il login.';
    case 403:
      return 'Non hai i permessi per eseguire questa azione.';
    case 404:
      return serverMsg || 'Risorsa non trovata.';
    case 409:
      return serverMsg || "Conflitto: la risorsa e' stata modificata da qualcun altro.";
    case 422:
      return serverMsg || 'Dati non validi: controlla i campi evidenziati.';
    case 429:
      return 'Troppe richieste ravvicinate. Aspetta qualche secondo e riprova.';
    case 502:
      // Il backend usa 502 tipicamente per fallimenti WordPress/Ollama.
      if (serverMsg?.toLowerCase().includes('wordpress')) return serverMsg;
      if (serverMsg?.toLowerCase().includes('ollama')) return serverMsg;
      return serverMsg || 'Servizio esterno non raggiungibile (WordPress/Ollama).';
    case 503:
      return 'Servizio momentaneamente non disponibile. Riprova fra poco.';
    case 504:
      return 'Timeout sul gateway. Riprova.';
    default:
      if (status >= 500) {
        return serverMsg
          ? `Errore del server: ${serverMsg}`
          : "Errore del server. Se il problema persiste contatta l'amministratore.";
      }
      return serverMsg || `Errore ${status}.`;
  }
}

function extractServerMessage(data: ApiErrorDetail | undefined): string | undefined {
  if (!data) return undefined;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    const first = data.detail[0];
    if (first && typeof first === 'object' && 'msg' in first) {
      return String(first.msg);
    }
  }
  if (typeof data.message === 'string') return data.message;
  return undefined;
}
