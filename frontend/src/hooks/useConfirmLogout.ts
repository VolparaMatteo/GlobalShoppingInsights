// ---------------------------------------------------------------------------
// hooks/useConfirmLogout.ts — Sprint 7 polish b6
//
// Helper DRY per il logout con conferma. Centralizza testo del modal +
// styling coerente tra topbar / sidebar / user menu.
// ---------------------------------------------------------------------------
import { App } from 'antd';

import { useAuthStore } from '@/stores/authStore';

/**
 * Ritorna una funzione che mostra un Modal.confirm di AntD prima di
 * invocare authStore.logout.
 *
 * Esempio:
 *   const confirmLogout = useConfirmLogout();
 *   <Button onClick={confirmLogout}>Esci</Button>
 */
export function useConfirmLogout() {
  const { modal } = App.useApp();
  const logout = useAuthStore((s) => s.logout);

  return () => {
    modal.confirm({
      title: 'Confermare uscita?',
      content:
        'Sarai disconnesso e riportato alla pagina di login. Le modifiche non salvate andranno perse.',
      okText: 'Esci',
      okType: 'danger',
      cancelText: 'Annulla',
      centered: true,
      autoFocusButton: 'cancel',
      onOk: logout,
    });
  };
}
