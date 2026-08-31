import { prisma } from '@/lib/prisma';
import { 
  calculateDaysActive, 
  calculateDelayHours, 
  calculateOnTimeStatus, 
  calculateLifecycleStatus, 
  generateNextDeliverableId,
  enrichTaskMetrics
} from '@/lib/trackerEngine';
import { logActivity } from '@/lib/services/activityService';
import type { Task, TaskStatus, SlipCause } from '@/types';
import type { z } from 'zod';
import type { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '@/lib/validation/schemas';

export interface TaskQueryParams extends z.infer<typeof TaskQuerySchema> {
  workspaceId?: string;
}

export async function getTasks(params: TaskQueryParams = { page: 1, limit: 50 }) {
  const { workspaceId = 'default-workspace', projectId, assigneeId, status, slipCause, search, page = 1, limit = 50 } = params;

  const where: any = {
    workspaceId,
  };

  if (projectId) where.projectId = projectId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (status && status !== 'All') where.status = status;
  if (slipCause && slipCause !== 'All') where.slipCause = slipCause;

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q } },
      { deliverableId: { contains: q } },
    ];
  }

  const [total, rawTasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const tasks: Task[] = rawTasks.map((t) => {
    const taskObj: Task = {
      id: t.id,
      deliverableId: t.deliverableId,
      projectId: t.projectId,
      assigneeId: t.assigneeId,
      title: t.title,
      status: t.status as TaskStatus,
      slipCause: t.slipCause as SlipCause,
      startDate: t.startDate ? t.startDate.toISOString().split('T')[0] : null,
      targetDueDate: t.targetDueDate ? t.targetDueDate.toISOString().split('T')[0] : null,
      dueDate: t.targetDueDate ? t.targetDueDate.toISOString().split('T')[0] : null,
      targetDueTime: t.targetDueTime,
      completedDate: t.completedDate ? t.completedDate.toISOString().split('T')[0] : null,
      completedTime: t.completedTime,
      daysActive: t.daysActive,
      delayHours: t.delayHours,
      onTimeStatus: t.onTimeStatus,
      lifecycleStatus: t.lifecycleStatus,
      labels: t.labels ? (typeof t.labels === 'string' ? JSON.parse(t.labels || '[]') : t.labels) : [],
      checklist: t.checklist ? (typeof t.checklist === 'string' ? JSON.parse(t.checklist || '[]') : t.checklist) : [],
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
    return enrichTaskMetrics(taskObj);
  });

  return {
    tasks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getTaskById(id: string, workspaceId = 'default-workspace'): Promise<Task | null> {
  const t = await prisma.task.findFirst({
    where: { id, workspaceId },
  });

  if (!t) return null;

  const taskObj: Task = {
    id: t.id,
    deliverableId: t.deliverableId,
    projectId: t.projectId,
    assigneeId: t.assigneeId,
    title: t.title,
    status: t.status as TaskStatus,
    slipCause: t.slipCause as SlipCause,
    startDate: t.startDate ? t.startDate.toISOString().split('T')[0] : null,
    targetDueDate: t.targetDueDate ? t.targetDueDate.toISOString().split('T')[0] : null,
    dueDate: t.targetDueDate ? t.targetDueDate.toISOString().split('T')[0] : null,
    targetDueTime: t.targetDueTime,
    completedDate: t.completedDate ? t.completedDate.toISOString().split('T')[0] : null,
    completedTime: t.completedTime,
    daysActive: t.daysActive,
    delayHours: t.delayHours,
    onTimeStatus: t.onTimeStatus,
    lifecycleStatus: t.lifecycleStatus,
    labels: t.labels ? (typeof t.labels === 'string' ? JSON.parse(t.labels || '[]') : t.labels) : [],
    checklist: t.checklist ? (typeof t.checklist === 'string' ? JSON.parse(t.checklist || '[]') : t.checklist) : [],
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };

  return enrichTaskMetrics(taskObj);
}

export async function createTask(
  data: z.infer<typeof CreateTaskSchema>,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  // Transaction for atomic deliverable ID generation & insertion
  return await prisma.$transaction(async (tx) => {
    // 1. Generate unique sequential Deliverable ID
    const existingTasks = await tx.task.findMany({
      where: { workspaceId },
      select: { deliverableId: true },
    });
    const deliverableId = generateNextDeliverableId(existingTasks.map((t) => t.deliverableId));

    // 2. Parse dates & calculate initial status
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const targetDueDate = data.targetDueDate ? new Date(data.targetDueDate) : null;
    const targetDueTime = data.targetDueTime || '10:00 PM';
    const status = data.status || 'In Progress';
    const slipCause = data.slipCause || 'N/A';

    const daysActive = calculateDaysActive(startDate, null);
    const delayHours = calculateDelayHours(targetDueDate, targetDueTime, null, null, status);
    const onTimeStatus = calculateOnTimeStatus(status, targetDueDate, targetDueTime, null, null);
    const lifecycleStatus = calculateLifecycleStatus(status, onTimeStatus, slipCause, delayHours);

    const labelsStr = typeof data.labels === 'string' ? data.labels : JSON.stringify(data.labels || []);
    const checklistStr = typeof data.checklist === 'string' ? data.checklist : JSON.stringify(data.checklist || []);

    const created = await tx.task.create({
      data: {
        deliverableId,
        workspaceId,
        userId: session.uid,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        title: data.title,
        status,
        slipCause,
        startDate,
        targetDueDate,
        targetDueTime,
        daysActive,
        delayHours,
        onTimeStatus,
        lifecycleStatus,
        labels: labelsStr,
        checklist: checklistStr,
        completedAt: status === 'Completed' ? new Date() : null,
      },
    });

    // 3. Fetch project and member names for structured audit log
    const [project, member] = await Promise.all([
      tx.project.findUnique({ where: { id: data.projectId } }),
      tx.teamMember.findUnique({ where: { id: data.assigneeId } }),
    ]);

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action: 'created',
        entityType: 'task',
        entityId: created.id,
        entityTitle: created.title,
        details: `Created deliverable ${deliverableId} assigned to ${member?.name || 'team member'} under ${project?.title || 'project'}.`,
        metadata: JSON.stringify({
          deliverableId,
          projectName: project?.title,
          assigneeName: member?.name,
          status,
          targetDueDate: data.targetDueDate,
          targetDueTime,
        }),
      },
    });

    return created;
  });
}

export async function updateTask(
  id: string,
  data: z.infer<typeof UpdateTaskSchema>,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.task.findFirst({
      where: { id, workspaceId },
      include: { project: true, assignee: true },
    });

    if (!existing) {
      throw new Error('Task not found');
    }

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.slipCause !== undefined) updateData.slipCause = data.slipCause || 'N/A';
    if (data.targetDueTime !== undefined) updateData.targetDueTime = data.targetDueTime;
    if (data.completedTime !== undefined) updateData.completedTime = data.completedTime;

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.targetDueDate !== undefined) {
      updateData.targetDueDate = data.targetDueDate ? new Date(data.targetDueDate) : null;
    }

    // Handle completion date & timestamp transitions
    const newStatus = data.status || existing.status;
    if (data.status === 'Completed' && existing.status !== 'Completed') {
      updateData.completedAt = new Date();
      updateData.completedDate = new Date();
      updateData.completedTime = data.completedTime || '10:00 PM';
    } else if (data.status && data.status !== 'Completed' && existing.status === 'Completed') {
      updateData.completedAt = null;
      updateData.completedDate = null;
      updateData.completedTime = null;
    }

    if (data.labels !== undefined) {
      updateData.labels = typeof data.labels === 'string' ? data.labels : JSON.stringify(data.labels);
    }
    if (data.checklist !== undefined) {
      updateData.checklist = typeof data.checklist === 'string' ? data.checklist : JSON.stringify(data.checklist);
    }

    // Recompute engine fields
    const effStartDate = updateData.startDate !== undefined ? updateData.startDate : existing.startDate;
    const effTargetDue = updateData.targetDueDate !== undefined ? updateData.targetDueDate : existing.targetDueDate;
    const effTargetTime = updateData.targetDueTime !== undefined ? updateData.targetDueTime : existing.targetDueTime;
    const effCompDate = updateData.completedDate !== undefined ? updateData.completedDate : existing.completedDate;
    const effCompTime = updateData.completedTime !== undefined ? updateData.completedTime : existing.completedTime;
    const effSlipCause = updateData.slipCause !== undefined ? updateData.slipCause : existing.slipCause;

    updateData.daysActive = calculateDaysActive(effStartDate, effCompDate);
    updateData.delayHours = calculateDelayHours(effTargetDue, effTargetTime, effCompDate, effCompTime, newStatus);
    updateData.onTimeStatus = calculateOnTimeStatus(newStatus, effTargetDue, effTargetTime, effCompDate, effCompTime);
    updateData.lifecycleStatus = calculateLifecycleStatus(newStatus, updateData.onTimeStatus, effSlipCause, updateData.delayHours);

    const updated = await tx.task.update({
      where: { id },
      data: updateData,
    });

    // Structured Activity Log
    let action = 'updated';
    let details = `Updated deliverable "${updated.title}".`;
    if (data.status && data.status !== existing.status) {
      action = data.status === 'Completed' ? 'completed' : 'status_changed';
      details = `Status changed from "${existing.status}" to "${data.status}".`;
    }

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action,
        entityType: 'task',
        entityId: updated.id,
        entityTitle: updated.title,
        details,
        metadata: JSON.stringify({
          deliverableId: updated.deliverableId,
          oldStatus: existing.status,
          newStatus: updated.status,
          delayHours: updated.delayHours,
          slipCause: updated.slipCause,
          projectName: existing.project?.title,
          assigneeName: existing.assignee?.name,
        }),
      },
    });

    return updated;
  });
}

export async function deleteTask(
  id: string,
  session: { uid: string; displayName: string; email?: string; workspaceId?: string }
) {
  const workspaceId = session.workspaceId || 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.task.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      throw new Error('Task not found');
    }

    await tx.task.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        workspaceId,
        userId: session.uid,
        actorName: session.displayName,
        actorEmail: session.email || null,
        action: 'deleted',
        entityType: 'task',
        entityId: id,
        entityTitle: existing.title,
        details: `Deleted deliverable ${existing.deliverableId || id} ("${existing.title}").`,
        metadata: JSON.stringify({
          deliverableId: existing.deliverableId,
          title: existing.title,
        }),
      },
    });

    return true;
  });
}
