const ROLE_HIERARCHY: Record<string, number> = {
  admin: 5,
  reviewer: 4,
  editor: 3,
  contributor: 2,
  read_only: 1,
};

export function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
}

export function canTransition(userRole: string, from: string, to: string): boolean {
  // mirrors backend TRANSITION_ROLES
  const TRANSITION_ROLES: Record<string, string[]> = {
    'imported->screened': ['contributor', 'editor', 'reviewer', 'admin'],
    'imported->rejected': ['editor', 'reviewer', 'admin'],
    'screened->in_review': ['editor', 'admin'],
    'screened->rejected': ['editor', 'reviewer', 'admin'],
    'in_review->approved': ['reviewer', 'admin'],
    'in_review->rejected': ['reviewer', 'admin'],
    'in_review->screened': ['reviewer', 'admin'],
    'approved->scheduled': ['editor', 'reviewer', 'admin'],
    'scheduled->approved': ['editor', 'reviewer', 'admin'],
    'publish_failed->scheduled': ['editor', 'reviewer', 'admin'],
    'rejected->imported': ['admin'],
  };
  const key = `${from}->${to}`;
  const roles = TRANSITION_ROLES[key] || [];
  return roles.includes(userRole);
}
