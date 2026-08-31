import { prisma } from '@/lib/prisma';
import { 
  calculateGlobalTaskMetrics, 
  calculateTeamPerformance, 
  calculateProjectPerformance, 
  filterActiveTasks,
  enrichTaskMetrics
} from '@/lib/trackerEngine';
import type { Task, TeamMember, Project, TaskStatus, SlipCause } from '@/types';

export async function getDashboardMetrics(workspaceId = 'default-workspace') {
  const [rawTeam, rawProjects, rawTasks] = await Promise.all([
    prisma.teamMember.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    }),
    prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const team: TeamMember[] = rawTeam.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    department: m.department,
    status: m.status,
    manager: m.manager,
    createdAt: m.createdAt.toISOString(),
  }));

  const projects: Project[] = rawProjects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    priority: p.priority as any,
    status: p.status as any,
    leadOwner: p.leadOwner,
    startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
    targetDate: p.targetDate ? p.targetDate.toISOString().split('T')[0] : null,
    createdAt: p.createdAt.toISOString(),
  }));

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

  const activeProjects = projects.filter((p) => p.status !== 'Archived');
  const activeTasks = filterActiveTasks(tasks, projects);

  const globalMetrics = calculateGlobalTaskMetrics(activeTasks);
  const teamPerformance = calculateTeamPerformance(team, activeTasks);
  const projectPerformance = calculateProjectPerformance(projects, activeTasks);

  // Derive Top Performer
  const topPerformers = teamPerformance.filter((m) => m.performanceRating === '🟢 Top Performer');
  const topPerformer = topPerformers.length > 0 ? topPerformers[0].name : 'None';

  // Overall On-Time Delivery Percentage
  const totalCompleted = globalMetrics.completed;
  const onTimeCompleted = activeTasks.filter(
    (t) => t.status === 'Completed' && (t.onTimeStatus === 'Yes' || (t.delayHours ?? 0) <= 0)
  ).length;
  const overallOnTimeRate = totalCompleted > 0 ? Math.round((onTimeCompleted / totalCompleted) * 100) : 100;

  return {
    metrics: globalMetrics,
    teamPerformance,
    projectPerformance,
    topPerformer,
    overallOnTimeRate,
    activeTasksCount: activeTasks.length,
    activeProjectsCount: activeProjects.length,
    teamMembersCount: team.length,
  };
}
