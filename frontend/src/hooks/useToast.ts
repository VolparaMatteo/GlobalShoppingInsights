// ---------------------------------------------------------------------------
// hooks/useToast.ts — Sprint 7 polish b2
//
// Wrapper sul message API di Ant Design (via App context) con:
//   - preset IT tipizzati (success/error/warning/info)
//   - integrazione automatica con errorToast per `error` di AxiosError
//   - `promise` helper per async operations (loading → result)
//
// Prerequisito: <AntdApp> wrapping dell'albero (fatto in App.tsx).
//
// Esempio:
//   const toast = useToast();
//   toast.success('Salvato!');
//   toast.error(err);                         // AxiosError mappato
//   toast.promise(saveUser(), {
//     loading: 'Salvataggio...',
//     success: 'Utente salvato',
//     error: (e) => describeError(e),
//   });
// ---------------------------------------------------------------------------
import { App } from 'antd';

import { describeError } from '@/utils/errorToast';

interface PromiseToastOptions<T> {
  loading: string;
  success: string | ((value: T) => string);
  error?: string | ((err: unknown) => string);
}

export function useToast() {
  const { message } = App.useApp();

  return {
    success: (content: string, duration = 2.5) => {
      message.success({ content, duration });
    },
    info: (content: string, duration = 2.5) => {
      message.info({ content, duration });
    },
    warning: (content: string, duration = 3) => {
      message.warning({ content, duration });
    },
    /**
     * Accetta sia una stringa sia un Error/AxiosError: mappa automaticamente
     * via describeError (IT, gestisce timeout/network/401/403/429/5xx/...).
     */
    error: (errOrMsg: unknown, duration = 4) => {
      const content = typeof errOrMsg === 'string' ? errOrMsg : describeError(errOrMsg);
      message.error({ content, duration });
    },
    /**
     * Mostra un loading toast, lo aggiorna a success/error al termine della
     * promise. Ritorna la promise originale per chaining.
     */
    promise: async <T>(promise: Promise<T>, options: PromiseToastOptions<T>): Promise<T> => {
      const key = `promise-${Date.now()}-${Math.random()}`;
      message.loading({ content: options.loading, key, duration: 0 });
      try {
        const result = await promise;
        const successMsg =
          typeof options.success === 'function' ? options.success(result) : options.success;
        message.success({ content: successMsg, key, duration: 2.5 });
        return result;
      } catch (err) {
        const errorMsg =
          typeof options.error === 'function'
            ? options.error(err)
            : (options.error ?? describeError(err));
        message.error({ content: errorMsg, key, duration: 4 });
        throw err;
      }
    },
  };
}
