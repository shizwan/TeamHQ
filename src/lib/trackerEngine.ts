import type { 
  Task, 
  TeamMember, 
  Project, 
  OnTimeStatus, 
  LifecycleStatus, 
  PerformanceData, 
  ProjectPerformanceData,
  ProjectHealth,
  TaskMetrics
} from '@/types';

// Format deliverable ID like DLV-000001
export function generateDeliverableId(num: number): string {
  return `DLV-${String(num).padStart(6, '0')}`;
}

// Calculate days active
export function calculateDaysActive(startDateStr?: string | Date | null, completedDateStr?: string | Date | null): number {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr).getTime();
  const end = completedDateStr ? new Date(completedDateStr).getTime() : Date.now();
  if (isNaN(start) || isNaN(end)) return 1;
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

// Filter out tasks belonging to Archived projects or marked as Archived
export function filterActiveTasks(tasks: Task[], projects: Project[] = []): Task[] {
  if (!tasks) return [];
  if (!projects || projects.length === 0) {
    return tasks.filter((t) => t.status !== 'Archived');
  }
  const archivedProjectIds = new Set(
    projects.filter((p) => p.status === 'Archived').map((p) => p.id)
  );
  return tasks.filter(
    (t) => !archivedProjectIds.has(t.projectId) && t.status !== 'Archived'
  );
}

// Helper to parse time string like "10:00 PM" into hours (24h)
function parseTimeString(timeStr?: string | null): number {
  if (!timeStr) return 22; // default 10:00 PM
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 22;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours + minutes / 60;
}

// Calculate delay in hours past target ETA
export function calculateDelayHours(
  targetDateStr?: string | Date | null,
  targetTimeStr?: string | null,
  completedDateStr?: string | Date | null,
  completedTimeStr?: string | null,
  status?: string
): number {
  if (!targetDateStr) return 0;
  const targetDate = new Date(targetDateStr);
  const targetHour = parseTimeString(targetTimeStr || '10:00 PM');
  targetDate.setHours(Math.floor(targetHour), (targetHour % 1) * 60, 0, 0);

  const actualDate = completedDateStr ? new Date(completedDateStr) : new Date();
  if (completedDateStr) {
    const actualHour = parseTimeString(completedTimeStr || '10:00 PM');
    actualDate.setHours(Math.floor(actualHour), (actualHour % 1) * 60, 0, 0);
  }

  if (status === 'Completed' || status === 'Cancelled') {
    if (completedDateStr) {
      const diffMs = actualDate.getTime() - targetDate.getTime();
      return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60)) : 0;
    }
    return 0;
  }

  const diffMs = Date.now() - targetDate.getTime();
  return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60)) : 0;
}

// Calculate On-Time evaluation status
export function calculateOnTimeStatus(
  status: string,
  targetDateStr?: string | Date | null,
  targetTimeStr?: string | null,
  completedDateStr?: string | Date | null,
  completedTimeStr?: string | null
): OnTimeStatus {
  if (status === 'Cancelled') return 'Unverified';
  if (!targetDateStr) return 'Unverified';

  const delayHrs = calculateDelayHours(targetDateStr, targetTimeStr, completedDateStr, completedTimeStr, status);

  if (status === 'Completed') {
    if (!completedDateStr) return 'Unverified';
    return delayHrs <= 0 ? 'Yes' : 'No';
  }

  return delayHrs > 0 ? 'No' : 'Pending';
}

// Calculate Lifecycle Status Badge
export function calculateLifecycleStatus(
  status: string,
  onTimeStatus: OnTimeStatus,
  slipCause?: string | null,
  delayHrs: number = 0
): LifecycleStatus {
  if (status === 'Cancelled') return '⚪ Cancelled';
  if (status === 'Carried Forward') return '🔴 Carried Fwd';
  if (status === 'Blocked') return '🔴 Overdue';
  
  if (status === 'Completed') {
    if (onTimeStatus === 'Unverified') return '⚠️ Unverified';
    return onTimeStatus === 'Yes' ? '🟢 On-Time' : '🔴 Delayed';
  }

  if (status === 'In Progress' || status === 'Pending') {
    if (delayHrs > 0) return '🔴 Overdue';
    return '🟢 In Progress';
  }

  return '🟢 Not Yet Due';
}

// Compute metrics for Team Performance Matrix
export function calculateTeamPerformance(team: TeamMember[], tasks: Task[]): PerformanceData[] {
  return team.map((member) => {
    const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
    const activeTasks = memberTasks.filter((t) => t.status === 'In Progress' || t.status === 'Carried Forward' || t.status === 'Blocked').length;
    const completedTasks = memberTasks.filter((t) => t.status === 'Completed').length;
    
    // On-Time completed tasks
    const onTimeCompleted = memberTasks.filter(
      (t) => t.status === 'Completed' && (t.onTimeStatus === 'Yes' || (t.delayHours ?? 0) <= 0)
    ).length;

    const onTimeRate = completedTasks > 0 ? Number((onTimeCompleted / completedTasks).toFixed(2)) : (activeTasks > 0 ? 0 : 1);
    const carriedForward = memberTasks.filter((t) => t.status === 'Carried Forward').length;
    const slipsLogged = memberTasks.filter((t) => t.slipCause && t.slipCause !== 'N/A').length;

    let performanceRating: '🔴 Action Required' | '⚪ Standby' | '🟢 Top Performer' | '🟡 Satisfactory' = '🟡 Satisfactory';
    if (memberTasks.length === 0) {
      performanceRating = '⚪ Standby';
    } else if (slipsLogged > 1 || onTimeRate < 0.6 || carriedForward > 0) {
      performanceRating = '🔴 Action Required';
    } else if (onTimeRate >= 0.8 && completedTasks >= 2) {
      performanceRating = '🟢 Top Performer';
    }

    const efficiencyScore = Math.round(onTimeRate * 100);

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      department: member.department,
      manager: member.manager || 'Shizwan',
      memberStatus: member.status || 'Active',
      activeTasks,
      completedTasks,
      onTimeRate,
      carriedForward,
      slipsLogged,
      performanceRating,

      // Legacy fields
      completed: completedTasks,
      overdue: memberTasks.filter((t) => (t.delayHours ?? 0) > 0 && t.status !== 'Completed').length,
      inProgress: memberTasks.filter((t) => t.status === 'In Progress').length,
      pending: memberTasks.filter((t) => t.status === 'Pending').length,
      total: memberTasks.length,
      completionRate: memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0,
      onTimeCompleted,
      lateCompleted: completedTasks - onTimeCompleted,
      efficiencyScore,
    };
  });
}

// Compute Project Performance & Health
export function calculateProjectPerformance(projects: Project[], tasks: Task[]): ProjectPerformanceData[] {
  return projects.map((p) => {
    const pTasks = tasks.filter((t) => t.projectId === p.id);
    const activeTasks = pTasks.filter((t) => t.status === 'In Progress' || t.status === 'Carried Forward' || t.status === 'Blocked').length;
    const completedTasks = pTasks.filter((t) => t.status === 'Completed').length;
    const total = pTasks.length;

    let health: ProjectHealth = '⚪ Inactive / Queue';
    if (total === 0) {
      health = '⚪ Inactive / Queue';
    } else if (activeTasks === 0 && completedTasks > 0) {
      health = '🟢 On Track (100%)';
    } else if (activeTasks > 0) {
      health = '🟡 Active Progress';
    }

    return {
      id: p.id,
      title: p.title,
      priority: p.priority || 'High',
      status: p.status,
      leadOwner: p.leadOwner || 'Shizwan',
      activeTasks,
      completedTasks,
      health,
    };
  });
}

// Global Task Metrics Counter
export function calculateGlobalTaskMetrics(tasks: Task[]): TaskMetrics {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const carriedForward = tasks.filter((t) => t.status === 'Carried Forward').length;
  const blocked = tasks.filter((t) => t.status === 'Blocked').length;
  const cancelled = tasks.filter((t) => t.status === 'Cancelled').length;
  const overdue = tasks.filter((t) => (t.delayHours ?? 0) > 0 && t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const pending = tasks.filter((t) => t.status === 'Pending').length;

  return {
    total,
    completed,
    inProgress,
    carriedForward,
    blocked,
    cancelled,
    overdue,
    pending,
  };
}
