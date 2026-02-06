export const STATUS_ORDER = ['imported', 'screened', 'in_review', 'approved', 'scheduled', 'publishing', 'published'];

export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  imported: ['screened', 'rejected'],
  screened: ['in_review', 'rejected'],
  in_review: ['approved', 'rejected', 'screened'],
  approved: ['scheduled'],
  scheduled: ['approved', 'publishing'],
  publishing: ['published', 'publish_failed'],
  publish_failed: ['scheduled'],
  rejected: ['imported'],
};

export function getNextStatuses(currentStatus: string): string[] {
  return WORKFLOW_TRANSITIONS[currentStatus] || [];
}
