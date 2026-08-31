import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // 1. Enforce server-side authentication
  const auth = await requireAuth(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const search = searchParams.get('search')?.trim();
    const limit = searchParams.get('limit') ? Math.min(Math.max(parseInt(searchParams.get('limit')!, 10), 1), 500) : 200;

    // 2. Scope strictly to the authenticated user/tenant
    const where: any = {
      userId: auth.user.uid,
    };

    if (entityType && entityType !== 'all') {
      where.entityType = entityType;
    }
    if (action && action !== 'all') {
      where.action = action;
    }

    // 3. Use structured AND condition for search to avoid overriding tenant/filter constraints
    if (search) {
      where.AND = [
        {
          OR: [
            { entityTitle: { contains: search } },
            { details: { contains: search } },
            { actorName: { contains: search } },
          ],
        },
      ];
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // 1. Enforce server-side authentication
  const auth = await requireAuth(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const log = await logActivity({
      ...body,
      userId: auth.user.uid,
      actorName: auth.user.displayName,
      actorEmail: auth.user.email,
    });

    if (!log) {
      return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
    }
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  // 1. Enforce server-side authentication
  const auth = await requireAuth(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    // 2. Delete ONLY records belonging to the authenticated user/tenant
    await prisma.activityLog.deleteMany({
      where: {
        userId: auth.user.uid,
      },
    });

    // 3. Record an audit milestone for the log purge
    await logActivity({
      userId: auth.user.uid,
      actorName: auth.user.displayName,
      actorEmail: auth.user.email,
      action: 'deleted',
      entityType: 'system',
      entityTitle: 'Audit Log Purge',
      details: `Activity audit trail cleared by ${auth.user.displayName} (${auth.user.email}).`,
    });

    return NextResponse.json({ success: true, message: 'All activity logs cleared successfully.' });
  } catch (error) {
    console.error('Failed to clear activity logs:', error);
    return NextResponse.json({ error: 'Failed to clear activity logs' }, { status: 500 });
  }
}
