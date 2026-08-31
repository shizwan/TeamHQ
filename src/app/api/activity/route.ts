import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, badRequestResponse, forbiddenResponse, serverErrorResponse } from '@/lib/auth';
import { ActivityQuerySchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/services/activityService';
import { validateCsrf } from '@/lib/security';

export async function GET(request: Request) {
  const authResult = await requireAuth(request, 'activity:view');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') || undefined;
    const action = searchParams.get('action') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const where: any = {
      workspaceId: authResult.user.workspaceId,
    };

    if (entityType && entityType !== 'all') where.entityType = entityType;
    if (action && action !== 'all') where.action = action;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { entityTitle: { contains: q } },
        { details: { contains: q } },
        { actorName: { contains: q } },
      ];
    }

    const [total, rawLogs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const logs = rawLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      actorName: log.actorName,
      actorEmail: log.actorEmail,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityTitle: log.entityTitle,
      details: log.details,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }));

    // If default full list requested, return array for backward compatibility
    if (limit >= 500 && !searchParams.has('page')) {
      return NextResponse.json(logs);
    }

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('[GET ACTIVITY LOGS ERROR]', error);
    return serverErrorResponse('Failed to fetch activity logs');
  }
}

/**
 * Audit log truncation is restricted strictly to ADMIN roles with CSRF protection and an audit record
 */
export async function DELETE(request: Request) {
  const authResult = await requireAuth(request, 'activity:clear');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  // Only ADMIN can clear activity logs
  if (authResult.user.role !== 'ADMIN') {
    return forbiddenResponse('Only Administrators can clear activity audit records');
  }

  try {
    const workspaceId = authResult.user.workspaceId;

    await prisma.activityLog.deleteMany({
      where: { workspaceId },
    });

    // Record the truncation action itself
    await logActivity({
      workspaceId,
      userId: authResult.user.uid,
      actorName: authResult.user.displayName,
      actorEmail: authResult.user.email,
      action: 'deleted',
      entityType: 'system',
      entityTitle: 'Audit Logs Truncated',
      details: `Audit trail history was cleared by administrator ${authResult.user.displayName}.`,
    });

    return NextResponse.json({ success: true, message: 'Activity logs cleared successfully' });
  } catch (error) {
    console.error('[DELETE ACTIVITY LOGS ERROR]', error);
    return serverErrorResponse('Failed to clear activity logs');
  }
}
