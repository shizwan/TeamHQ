import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { sanitizeString } from '@/lib/validation';
import { MAX_TITLE_LENGTH } from '@/types';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.project.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) {
      const sanitizedTitle = sanitizeString(body.title);
      if (!sanitizedTitle) {
        return NextResponse.json({ error: 'Project title cannot be empty' }, { status: 400 });
      }
      if (sanitizedTitle.length > MAX_TITLE_LENGTH) {
        return NextResponse.json({ error: `Title must be under ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
      }
      updateData.title = sanitizedTitle;
    }
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

    const isArchiving = body.status === 'Archived' && existing.status !== 'Archived';
    const isUnarchiving = body.status === 'Active' && existing.status === 'Archived';
    const action = isArchiving ? 'archived' : isUnarchiving ? 'unarchived' : 'updated';
    const details = isArchiving
      ? `Archived project "${project.title}".`
      : isUnarchiving
      ? `Restored project "${project.title}" from archive.`
      : `Updated project "${project.title}" settings.`;

    logActivity({
      userId: auth.user.uid,
      actorName: auth.user.displayName,
      actorEmail: auth.user.email,
      action,
      entityType: 'project',
      entityId: project.id,
      entityTitle: project.title,
      details,
      metadata: { status: project.status, priority: project.priority },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const taskCount = await prisma.task.count({ where: { projectId: id } });

    await prisma.project.delete({
      where: { id },
    });

    logActivity({
      userId: auth.user.uid,
      actorName: auth.user.displayName,
      actorEmail: auth.user.email,
      action: 'deleted',
      entityType: 'project',
      entityId: existing.id,
      entityTitle: existing.title,
      details: `Deleted project "${existing.title}" (${taskCount} associated task(s) removed).`,
      metadata: { taskCount },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json({ success: true, deletedTasksCount: taskCount });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project', details: String(error) }, { status: 500 });
  }
}
