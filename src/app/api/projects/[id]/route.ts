import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.project.findUnique({ where: { id } });

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.leadOwner !== undefined) updateData.leadOwner = body.leadOwner;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.targetDate !== undefined) updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    if (body.dueDate !== undefined && body.targetDate === undefined) updateData.targetDate = body.dueDate ? new Date(body.dueDate) : null;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    const isArchiving = body.status === 'Archived' && existing?.status !== 'Archived';
    const isUnarchiving = body.status === 'Active' && existing?.status === 'Archived';
    const action = isArchiving ? 'archived' : isUnarchiving ? 'unarchived' : 'updated';
    const details = isArchiving
      ? `Archived project "${project.title}".`
      : isUnarchiving
      ? `Restored project "${project.title}" from archive.`
      : `Updated project "${project.title}" settings.`;

    logActivity({
      userId: project.userId,
      action,
      entityType: 'project',
      entityId: project.id,
      entityTitle: project.title,
      details,
      metadata: { status: project.status, priority: project.priority },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id } });

    await prisma.project.delete({
      where: { id },
    });

    if (existing) {
      logActivity({
        userId: existing.userId,
        action: 'deleted',
        entityType: 'project',
        entityId: existing.id,
        entityTitle: existing.title,
        details: `Deleted project "${existing.title}".`,
      }).catch((err) => console.error('Activity log error:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
