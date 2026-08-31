import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project = await prisma.project.create({ data: body });

    logActivity({
      userId: project.userId,
      action: 'created',
      entityType: 'project',
      entityId: project.id,
      entityTitle: project.title,
      details: `Initiated project "${project.title}" with priority ${project.priority}.`,
      metadata: { priority: project.priority, status: project.status },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
