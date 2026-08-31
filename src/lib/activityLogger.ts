import { prisma } from '@/lib/prisma';

export interface LogActivityParams {
  userId?: string;
  actorName?: string;
  actorEmail?: string;
  action: 'created' | 'updated' | 'status_changed' | 'completed' | 'deleted' | 'archived' | 'unarchived' | string;
  entityType: 'task' | 'project' | 'team_member' | 'system' | string;
  entityId?: string | null;
  entityTitle: string;
  details?: string | null;
  metadata?: Record<string, any> | null;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId || 'admin-user',
        actorName: params.actorName || 'Shizwan',
        actorEmail: params.actorEmail || 'shizwan@teamhq.io',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        entityTitle: params.entityTitle,
        details: params.details || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
    return null;
  }
}

export async function seedInitialActivityLogs() {
  try {
    const existingLogsCount = await prisma.activityLog.count();
    if (existingLogsCount > 0) return;

    // Fetch existing tasks, projects, team to build realistic audit history
    const [tasks, projects, team] = await Promise.all([
      prisma.task.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
      prisma.project.findMany({ take: 10 }),
      prisma.teamMember.findMany({ take: 10 }),
    ]);

    const teamMap: Record<string, string> = {};
    for (const m of team) teamMap[m.id] = m.name;

    const projectMap: Record<string, string> = {};
    for (const p of projects) projectMap[p.id] = p.title;

    const seedEntries: Array<{
      userId: string;
      actorName: string;
      actorEmail: string;
      action: string;
      entityType: string;
      entityId: string | null;
      entityTitle: string;
      details: string;
      metadata: string;
      createdAt: Date;
    }> = [];

    // 1. Team member creation logs
    for (const m of team) {
      seedEntries.push({
        userId: 'admin-user',
        actorName: 'Shizwan',
        actorEmail: 'shizwan@teamhq.io',
        action: 'created',
        entityType: 'team_member',
        entityId: m.id,
        entityTitle: m.name,
        details: `Added ${m.name} as ${m.role}${m.department ? ` (${m.department})` : ''} to team roster.`,
        metadata: JSON.stringify({ role: m.role, department: m.department, status: m.status }),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 5) + 3)),
      });
    }

    // 2. Project creation logs
    for (const p of projects) {
      seedEntries.push({
        userId: 'admin-user',
        actorName: p.leadOwner || 'Shizwan',
        actorEmail: 'shizwan@teamhq.io',
        action: p.status === 'Archived' ? 'archived' : 'created',
        entityType: 'project',
        entityId: p.id,
        entityTitle: p.title,
        details: p.status === 'Archived'
          ? `Archived project "${p.title}".`
          : `Initiated project "${p.title}" with priority ${p.priority}.`,
        metadata: JSON.stringify({ priority: p.priority, status: p.status, leadOwner: p.leadOwner }),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 4) + 2)),
      });
    }

    // 3. Task lifecycle logs
    for (const t of tasks) {
      const assigneeName = teamMap[t.assigneeId] || 'Team';
      const projectName = projectMap[t.projectId] || 'General';

      if (t.status === 'Completed') {
        seedEntries.push({
          userId: 'admin-user',
          actorName: assigneeName,
          actorEmail: 'team@teamhq.io',
          action: 'completed',
          entityType: 'task',
          entityId: t.id,
          entityTitle: t.title,
          details: `Completed deliverable [${t.deliverableId || 'DLV'}] "${t.title}" for ${projectName}. On-Time Status: ${t.onTimeStatus}.`,
          metadata: JSON.stringify({
            deliverableId: t.deliverableId,
            projectName,
            assigneeName,
            status: 'Completed',
            delayHours: t.delayHours,
          }),
          createdAt: t.completedDate ? new Date(t.completedDate) : new Date(Date.now() - 1000 * 60 * 60 * (Math.floor(Math.random() * 24) + 1)),
        });
      } else if (t.status === 'Blocked' || t.status === 'Carried Forward') {
        seedEntries.push({
          userId: 'admin-user',
          actorName: assigneeName,
          actorEmail: 'team@teamhq.io',
          action: 'status_changed',
          entityType: 'task',
          entityId: t.id,
          entityTitle: t.title,
          details: `Flagged [${t.deliverableId || 'DLV'}] as ${t.status}. Slip cause: ${t.slipCause || 'Unspecified'}.`,
          metadata: JSON.stringify({
            deliverableId: t.deliverableId,
            projectName,
            assigneeName,
            status: t.status,
            slipCause: t.slipCause,
          }),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * (Math.floor(Math.random() * 36) + 2)),
        });
      } else {
        seedEntries.push({
          userId: 'admin-user',
          actorName: 'Shizwan',
          actorEmail: 'shizwan@teamhq.io',
          action: 'created',
          entityType: 'task',
          entityId: t.id,
          entityTitle: t.title,
          details: `Assigned deliverable [${t.deliverableId || 'DLV'}] to ${assigneeName} in ${projectName}.`,
          metadata: JSON.stringify({
            deliverableId: t.deliverableId,
            projectName,
            assigneeName,
            status: t.status,
            targetDueDate: t.targetDueDate,
          }),
          createdAt: t.startDate ? new Date(t.startDate) : new Date(Date.now() - 1000 * 60 * 60 * (Math.floor(Math.random() * 48) + 4)),
        });
      }
    }

    // Sort by createdAt descending
    seedEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    for (const entry of seedEntries) {
      await prisma.activityLog.create({ data: entry });
    }
  } catch (error) {
    console.error('Failed to seed activity logs:', error);
  }
}
