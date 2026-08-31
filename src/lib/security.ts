export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export type Permission =
  | 'task:create'
  | 'task:edit'
  | 'task:status_change'
  | 'task:delete'
  | 'project:create'
  | 'project:edit'
  | 'project:archive'
  | 'project:delete'
  | 'team:manage'
  | 'team:delete'
  | 'user:manage'
  | 'reports:view'
  | 'activity:view'
  | 'activity:clear'
  | 'system:admin';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'task:create',
    'task:edit',
    'task:status_change',
    'task:delete',
    'project:create',
    'project:edit',
    'project:archive',
    'project:delete',
    'team:manage',
    'team:delete',
    'user:manage',
    'reports:view',
    'activity:view',
    'activity:clear',
    'system:admin',
  ],
  MANAGER: [
    'task:create',
    'task:edit',
    'task:status_change',
    'task:delete',
    'project:create',
    'project:edit',
    'project:archive',
    'team:manage',
    'reports:view',
    'activity:view',
  ],
  MEMBER: [
    'task:create',
    'task:edit',
    'task:status_change',
    'reports:view',
    'activity:view',
  ],
  VIEWER: [
    'reports:view',
    'activity:view',
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = (role || '').toUpperCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function isRoleAtLeast(userRole: string, minimumRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    VIEWER: 1,
    MEMBER: 2,
    MANAGER: 3,
    ADMIN: 4,
  };

  const userRank = roleHierarchy[(userRole || '').toUpperCase() as UserRole] || 0;
  const minRank = roleHierarchy[minimumRole] || 0;

  return userRank >= minRank;
}

/**
 * Validates CSRF for state-changing browser requests (POST, PUT, PATCH, DELETE)
 */
export function validateCsrf(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  // 1. Check custom anti-CSRF header (browsers do not allow cross-origin requests to send custom headers without CORS preflight approval)
  const requestedWith = req.headers.get('x-requested-with') || req.headers.get('x-csrf-token');
  if (requestedWith) {
    return true;
  }

  // 2. Check Content-Type is application/json
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    // Check Origin or Referer header match
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host === host) return true;
      } catch {}
    }

    if (referer && host) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host === host) return true;
      } catch {}
    }

    // Default to true for direct API calls with application/json
    return true;
  }

  return false;
}
