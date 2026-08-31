import { prisma } from '@/lib/prisma';
import type { TeamMember } from '@/types';
import type { z } from 'zod';
import type { CreateMemberSchema, UpdateMemberSchema } from '@/lib/validation/schemas';

export async function getTeamMembers(workspaceId = 'default-workspace', includeInactive = true) {
  const where: any = { workspaceId };
  if (!includeInactive) {
    where.status = 'Active';
  }

  const raw = await prisma.teamMember.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return raw.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    department: m.department,
    status: m.status,
    manager: m.manager || 'Shizwan',
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function getTeamMemberById(id: string, workspaceId = 'default-workspace') {
  const m = await prisma.teamMember.findFirst({
    where: { id, workspaceId },
  });
  if (!m) return null;

  return {
    id: m.id,
    name: m.name,
    role: m.role,
    department: m.department,
    status: m.status,
    manager: m.manager || 'Shizwan',
    createdAt: m.createdAt.toISOString(),
  };
}

export async function createTeamMember(
  data: z.infer<typeof CreateMemberSchema>,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    const created = await tx.teamMember.create({
      data: {
        workspaceId,
        userId: session.uid,
        name: data.name,
        role: data.role,
        department: data.department || null,
        status: data.status || 'Active',
        manager: data.manager || 'Shizwan',
      },
    });

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action: 'created',
        entityType: 'team_member',
        entityId: created.id,
        entityTitle: created.name,
        details: `Added ${created.name} (${created.role}) to team roster.`,
      },
    });

    return created;
  });
}

export async function updateTeamMember(
  id: string,
  data: z.infer<typeof UpdateMemberSchema>,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.teamMember.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error('Team member not found');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.manager !== undefined) updateData.manager = data.manager;

    const updated = await tx.teamMember.update({
      where: { id },
      data: updateData,
    });

    let action = 'updated';
    let details = `Updated team member profile for "${updated.name}".`;
    if (data.status && data.status !== existing.status) {
      action = 'status_changed';
      details = `Changed status of ${updated.name} to ${data.status}.`;
    }

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action,
        entityType: 'team_member',
        entityId: updated.id,
        entityTitle: updated.name,
        details,
      },
    });

    return updated;
  });
}

export async function deleteTeamMember(
  id: string,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.teamMember.findFirst({
      where: { id, workspaceId },
      include: { tasks: true },
    });

    if (!existing) {
      throw new Error('Team member not found');
    }

    const taskCount = existing.tasks.length;

    // Safety rule: If team member has historical deliverables, soft-deactivate instead of deleting tasks
    if (taskCount > 0) {
      await tx.teamMember.update({
        where: { id },
        data: { status: 'Inactive' },
      });

      await tx.activityLog.create({
        data: {
          workspaceId,
          userId: session.uid,
          actorName: session.displayName,
          actorEmail: session.email || null,
          action: 'archived',
          entityType: 'team_member',
          entityId: id,
          entityTitle: existing.name,
          details: `Deactivated team member "${existing.name}" (preserved ${taskCount} historical deliverable records).`,
        },
      });

      return { softDeleted: true, message: `Member deactivated. ${taskCount} historical deliverables preserved.` };
    }

    // If 0 tasks, safe to hard delete
    await tx.teamMember.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action: 'deleted',
        entityType: 'team_member',
        entityId: id,
        entityTitle: existing.name,
        details: `Removed team member "${existing.name}" from roster.`,
      },
    });

    return { softDeleted: false, deleted: true };
  });
}
