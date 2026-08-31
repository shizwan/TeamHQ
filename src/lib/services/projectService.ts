import { prisma } from '@/lib/prisma';
import type { Project, ProjectStatus, ProjectPriority } from '@/types';
import type { z } from 'zod';
import type { CreateProjectSchema, UpdateProjectSchema } from '@/lib/validation/schemas';

export async function getProjects(workspaceId = 'default-workspace', statusFilter?: string) {
  const where: any = { workspaceId };
  if (statusFilter && statusFilter !== 'All') {
    where.status = statusFilter;
  }

  const raw = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return raw.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    priority: (p.priority || 'High') as ProjectPriority,
    status: p.status as ProjectStatus,
    leadOwner: p.leadOwner || 'Shizwan',
    startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
    targetDate: p.targetDate ? p.targetDate.toISOString().split('T')[0] : null,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function getProjectById(id: string, workspaceId = 'default-workspace') {
  const p = await prisma.project.findFirst({
    where: { id, workspaceId },
  });
  if (!p) return null;

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    priority: (p.priority || 'High') as ProjectPriority,
    status: p.status as ProjectStatus,
    leadOwner: p.leadOwner || 'Shizwan',
    startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
    targetDate: p.targetDate ? p.targetDate.toISOString().split('T')[0] : null,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function createProject(
  data: z.infer<typeof CreateProjectSchema>,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        workspaceId,
        userId: session.uid,
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'High',
        status: data.status || 'Active',
        leadOwner: data.leadOwner || 'Shizwan',
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
    });

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action: 'created',
        entityType: 'project',
        entityId: created.id,
        entityTitle: created.title,
        details: `Created new project "${created.title}" with priority ${created.priority}.`,
      },
    });

    return created;
  });
}

export async function updateProject(
  id: string,
  data: z.infer<typeof UpdateProjectSchema>,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.project.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error('Project not found');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.leadOwner !== undefined) updateData.leadOwner = data.leadOwner;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;

    const updated = await tx.project.update({
      where: { id },
      data: updateData,
    });

    let action = 'updated';
    let details = `Updated project "${updated.title}".`;
    if (data.status && data.status !== existing.status) {
      if (data.status === 'Archived') {
        action = 'archived';
        details = `Archived project "${updated.title}".`;
      } else if (existing.status === 'Archived') {
        action = 'unarchived';
        details = `Restored project "${updated.title}" to ${data.status}.`;
      } else {
        action = 'status_changed';
        details = `Project status changed from "${existing.status}" to "${data.status}".`;
      }
    }

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action,
        entityType: 'project',
        entityId: updated.id,
        entityTitle: updated.title,
        details,
      },
    });

    return updated;
  });
}

export async function deleteProject(
  id: string,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.project.findFirst({
      where: { id, workspaceId },
      include: { tasks: true },
    });

    if (!existing) {
      throw new Error('Project not found');
    }

    const taskCount = existing.tasks.length;

    await tx.project.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action: 'deleted',
        entityType: 'project',
        entityId: id,
        entityTitle: existing.title,
        details: `Deleted project "${existing.title}" along with ${taskCount} associated deliverables.`,
      },
    });

    return { deleted: true, affectedTasksCount: taskCount };
  });
}
