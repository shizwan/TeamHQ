import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedInitialActivityLogs, logActivity } from '@/lib/activityLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

    const count = await prisma.activityLog.count();
    if (count === 0) {
      await seedInitialActivityLogs();
    }

    const where: any = {};
    if (entityType && entityType !== 'all') {
      where.entityType = entityType;
    }
    if (action && action !== 'all') {
      where.action = action;
    }
    if (search) {
      where.OR = [
        { entityTitle: { contains: search } },
        { details: { contains: search } },
        { actorName: { contains: search } },
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
  try {
    const body = await req.json();
    const log = await logActivity(body);
    if (!log) {
      return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
    }
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.activityLog.deleteMany({});
    return NextResponse.json({ success: true, message: 'All activity logs cleared' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear activity logs' }, { status: 500 });
  }
}
