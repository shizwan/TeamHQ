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

    const title = (body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
    }

    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const targetDate = body.targetDate || body.dueDate ? new Date(body.targetDate || body.dueDate) : null;

    const project = await prisma.project.create({
      data: {
        userId: body.userId || 'admin-user',
        title,
        description: body.description || '',
        priority: body.priority || 'High',
        status: body.status || 'Active',
        leadOwner: body.leadOwner || 'Shizwan',
        startDate,
        targetDate,
      },
    });

    logActivity({
      userId: project.userId,
      action: 'created',
      entityType: 'project',
      entityId: project.id,
      entityTitle: project.title,
      details: `Initiated project "${project.title}" with priority ${project.priority}.`,
      metadata: { priority: project.priority, status: project.status, leadOwner: project.leadOwner },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project', details: String(error) }, { status: 500 });
  }
}
