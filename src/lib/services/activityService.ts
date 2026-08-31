import { prisma } from '@/lib/prisma';
import type { ActivityAction, ActivityEntityType } from '@/types';

export interface LogActivityParams {
  workspaceId?: string;
  userId?: string;
  actorName?: string;
  actorEmail?: string | null;
  action: ActivityAction | string;
  entityType: ActivityEntityType | string;
  entityId?: string | null;
  entityTitle: string;
  details?: string | null;
  metadata?: Record<string, any> | string | null;
}

/**
 * Log an audit trail event. Append-only and safe against failure.
 */
export async function logActivity(params: LogActivityParams) {
  try {
    const metaString =
      params.metadata && typeof params.metadata === 'object'
        ? JSON.stringify(params.metadata)
        : (params.metadata as string) || null;

    return await prisma.activityLog.create({
      data: {
        workspaceId: params.workspaceId || 'default-workspace',
        userId: params.userId || 'admin-user',
        actorName: params.actorName || 'Team Manager',
        actorEmail: params.actorEmail || 'manager@teamhq.io',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        entityTitle: params.entityTitle,
        details: params.details || null,
        metadata: metaString,
      },
    });
  } catch (error) {
    console.error('[ACTIVITY LOGGER ERROR]', error);
    return null;
  }
}
