import dayjs from 'dayjs';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('DD/MM/YY');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('DD/MM/YY HH:mm');
}

export function formatRelative(date: string | Date): string {
  return dayjs(date).fromNow();
}
