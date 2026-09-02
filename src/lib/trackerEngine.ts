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

/**
 * Generates a formatted Deliverable ID (e.g. DLV-000001)
 */
export function generateDeliverableId(num: number): string {
  return `DLV-${String(Math.max(1, num)).padStart(6, '0')}`;
}

/**
 * Extracts highest integer ID from an array of existing deliverable IDs
 * and returns the next strictly unique, monotonic Deliverable ID.
 */
export function generateNextDeliverableId(existingIds: (string | null | undefined)[]): string {
  let maxId = 0;
  for (const id of existingIds) {
    if (!id) continue;
    const match = id.match(/DLV-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  }
  return generateDeliverableId(maxId + 1);
}

/**
 * Timezone-agnostic helper to parse time strings like "10:00 PM" or "22:00" into hours & minutes
 */
export function parseTimeString(timeStr?: string | null): { hours: number; minutes: number; decimalHours: number } {
  if (!timeStr) return { hours: 22, minutes: 0, decimalHours: 22 }; // default 10:00 PM

  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { hours, minutes, decimalHours: hours + minutes / 60 };
  }

  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return { hours, minutes, decimalHours: hours + minutes / 60 };
  }

  return { hours: 22, minutes: 0, decimalHours: 22 };
}

/**
 * Format Date to 12-hour time string "hh:mm A" (e.g. "03:45 PM")
 */
export function formatTimeString(dateInput?: string | Date | null): string {
  if (!dateInput) return '10:00 PM';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '10:00 PM';
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : String(minutes);
  const hoursStr = hours < 10 ? '0' + hours : String(hours);
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

/**
 * Converts a 12-hour time string (e.g. "03:45 PM" or "10:00 AM") to 24-hour "HH:mm" (e.g. "15:45")
 */
export function time12To24(time12?: string | null): string {
  if (!time12) return '22:00';
  const { hours, minutes } = parseTimeString(time12);
  const hh = hours < 10 ? '0' + hours : String(hours);
  const mm = minutes < 10 ? '0' + minutes : String(minutes);
  return `${hh}:${mm}`;
}

/**
 * Converts a 24-hour time string (e.g. "15:45") or any time string to 12-hour "hh:mm A" (e.g. "03:45 PM")
 */
export function time24To12(time24?: string | null): string {
  if (!time24) return '10:00 PM';
  const { hours, minutes } = parseTimeString(time24);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let h = hours % 12;
  if (h === 0) h = 12;
  const hh = h < 10 ? '0' + h : String(h);
  const mm = minutes < 10 ? '0' + minutes : String(minutes);
  return `${hh}:${mm} ${ampm}`;
}

/**
 * Parses date input and target time slot into a precise, timezone-consistent Date object.
 */
export function parseDateWithTime(
  dateInput?: string | Date | null,
  timeStr?: string | null
): Date | null {
  if (!dateInput) return null;

  let year: number;
  let month: number;
  let day: number;

  if (typeof dateInput === 'string') {
    const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      year = parseInt(dateMatch[1], 10);
      month = parseInt(dateMatch[2], 10) - 1;
      day = parseInt(dateMatch[3], 10);
    } else {
      const parsed = new Date(dateInput);
      if (isNaN(parsed.getTime())) return null;
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    }
  } else {
    if (isNaN(dateInput.getTime())) return null;
    year = dateInput.getFullYear();
    month = dateInput.getMonth();
    day = dateInput.getDate();
  }

  const { hours, minutes } = parseTimeString(timeStr || '10:00 PM');
  return new Date(year, month, day, hours, minutes, 0, 0);
}

/**
 * Calculate days active between start and completion/current date
 */
export function calculateDaysActive(
  startDateStr?: string | Date | null, 
  completedDateStr?: string | Date | null
): number {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr).getTime();
  const end = completedDateStr ? new Date(completedDateStr).getTime() : Date.now();
  if (isNaN(start) || isNaN(end)) return 1;
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Filter out tasks belonging to Archived projects or marked as Archived
 */
export function filterActiveTasks(tasks: Task[], projects: Project[] = []): Task[] {
  if (!tasks || !Array.isArray(tasks)) return [];
  if (!projects || projects.length === 0) {
    return tasks.filter((t) => t && t.status !== 'Archived').map(enrichTaskMetrics);
  }
  const archivedProjectIds = new Set(
    projects.filter((p) => p.status === 'Archived').map((p) => p.id)
  );
  return tasks
    .filter((t) => t && !archivedProjectIds.has(t.projectId) && t.status !== 'Archived')
    .map(enrichTaskMetrics);
}

/**
 * Calculate delay in hours past target ETA
 */
export function calculateDelayHours(
  targetDateStr?: string | Date | null,
  targetTimeStr?: string | null,
  completedDateStr?: string | Date | null,
  completedTimeStr?: string | null,
  status?: string
): number {
  if (!targetDateStr) return 0;
  const targetDate = parseDateWithTime(targetDateStr, targetTimeStr || '10:00 PM');
  if (!targetDate) return 0;

  if (status === 'Completed' || status === 'Cancelled') {
    if (completedDateStr) {
      const actualDate = parseDateWithTime(completedDateStr, completedTimeStr || '10:00 PM');
      if (actualDate) {
        const diffMs = actualDate.getTime() - targetDate.getTime();
        return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60)) : 0;
      }
    }
    return 0;
  }

  const diffMs = Date.now() - targetDate.getTime();
  return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60)) : 0;
}

/**
 * Calculate On-Time evaluation status
 */
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

/**
 * Calculate Lifecycle Status Badge
 */
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

/**
 * Dynamically enriches a task with live real-time delay and lifecycle metrics on-read
 */
export function enrichTaskMetrics(task: Task): Task {
  const targetDate = task.targetDueDate || task.dueDate;
  const compDate = task.completedDate || task.completedAt;

  const liveDelayHours = calculateDelayHours(
    targetDate,
    task.targetDueTime,
    compDate,
    task.completedTime,
    task.status
  );

  const liveOnTimeStatus = calculateOnTimeStatus(
    task.status,
    targetDate,
    task.targetDueTime,
    compDate,
    task.completedTime
  );

  const liveLifecycleStatus = calculateLifecycleStatus(
    task.status,
    liveOnTimeStatus,
    task.slipCause,
    liveDelayHours
  );

  const liveDaysActive = calculateDaysActive(task.startDate, compDate);

  return {
    ...task,
    delayHours: liveDelayHours,
    onTimeStatus: liveOnTimeStatus,
    lifecycleStatus: liveLifecycleStatus,
    daysActive: liveDaysActive,
  };
}

/**
 * Compute metrics for Team Performance Matrix
 */
export function calculateTeamPerformance(team: TeamMember[], tasks: Task[]): PerformanceData[] {
  const enrichedTasks = tasks.map(enrichTaskMetrics);

  return team.map((member) => {
    const memberTasks = enrichedTasks.filter((t) => t.assigneeId === member.id);
    const activeTasks = memberTasks.filter(
      (t) => t.status === 'In Progress' || t.status === 'Carried Forward' || t.status === 'Blocked'
    ).length;
    const completedTasks = memberTasks.filter((t) => t.status === 'Completed').length;
    
    // On-Time completed tasks
    const onTimeCompleted = memberTasks.filter(
      (t) => t.status === 'Completed' && (t.onTimeStatus === 'Yes' || (t.delayHours ?? 0) <= 0)
    ).length;

    // If a member has completed tasks, calculate on-time rate.
    // If they have no completed tasks but have active tasks and zero slips, they are in good standing (1.0 rate).
    const onTimeRate = completedTasks > 0 
      ? Number((onTimeCompleted / completedTasks).toFixed(2)) 
      : 1.0;

    const carriedForward = memberTasks.filter((t) => t.status === 'Carried Forward').length;
    const slipsLogged = memberTasks.filter((t) => t.slipCause && t.slipCause !== 'N/A').length;

    // Performance Rating Rule:
    // - Standby: 0 deliverables assigned
    // - Action Required: Any slips logged, any carried forward, or on-time completion rate < 60% with completed work
    // - Top Performer: >= 80% on-time completion rate with at least 2 completed deliverables and zero slips
    // - Satisfactory: Normal active progress with clean track record
    let performanceRating: '🔴 Action Required' | '⚪ Standby' | '🟢 Top Performer' | '🟡 Satisfactory' = '🟡 Satisfactory';
    if (memberTasks.length === 0) {
      performanceRating = '⚪ Standby';
    } else if (slipsLogged > 0 || carriedForward > 0 || (completedTasks > 0 && onTimeRate < 0.6)) {
      performanceRating = '🔴 Action Required';
    } else if (onTimeRate >= 0.8 && completedTasks >= 2 && slipsLogged === 0 && carriedForward === 0) {
      performanceRating = '🟢 Top Performer';
    } else {
      performanceRating = '🟡 Satisfactory';
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
      overdue: memberTasks.filter((t) => (t.delayHours ?? 0) > 0 && t.status !== 'Completed' && t.status !== 'Cancelled').length,
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

/**
 * Compute Project Performance & Health
 */
export function calculateProjectPerformance(projects: Project[], tasks: Task[]): ProjectPerformanceData[] {
  const enrichedTasks = tasks.map(enrichTaskMetrics);

  return projects
    .filter((p) => p.status !== 'Archived')
    .map((p) => {
      const pTasks = enrichedTasks.filter((t) => t.projectId === p.id);
      const activeTasks = pTasks.filter(
        (t) => t.status === 'In Progress' || t.status === 'Carried Forward' || t.status === 'Blocked'
      ).length;
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

/**
 * Global Task Metrics Counter with live overdue evaluation
 */
export function calculateGlobalTaskMetrics(tasks: Task[]): TaskMetrics {
  const enrichedTasks = tasks.map(enrichTaskMetrics);

  const total = enrichedTasks.length;
  const completed = enrichedTasks.filter((t) => t.status === 'Completed').length;
  const inProgress = enrichedTasks.filter((t) => t.status === 'In Progress').length;
  const carriedForward = enrichedTasks.filter((t) => t.status === 'Carried Forward').length;
  const blocked = enrichedTasks.filter((t) => t.status === 'Blocked').length;
  const cancelled = enrichedTasks.filter((t) => t.status === 'Cancelled').length;
  const overdue = enrichedTasks.filter((t) => (t.delayHours ?? 0) > 0 && t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const pending = enrichedTasks.filter((t) => t.status === 'Pending').length;

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

/**
 * Unified calculation of detailed delay metrics for reports and teammate profiles
 */
export function calculateTaskDelayDetailed(
  targetDueDate?: string | Date | null,
  targetDueTime?: string | null,
  completedDate?: string | Date | null,
  completedTime?: string | null,
  status?: string
): { isDelayed: boolean; delayMs: number; delayHours: number; delayString: string } {
  if (!targetDueDate) return { isDelayed: false, delayMs: 0, delayHours: 0, delayString: '' };
  
  const targetDate = parseDateWithTime(targetDueDate, targetDueTime || '10:00 PM');
  if (!targetDate) return { isDelayed: false, delayMs: 0, delayHours: 0, delayString: '' };

  let actualDate: Date;
  if (status === 'Completed' || status === 'Cancelled') {
    if (!completedDate) return { isDelayed: false, delayMs: 0, delayHours: 0, delayString: '' };
    actualDate = parseDateWithTime(completedDate, completedTime || '10:00 PM') || new Date();
  } else {
    actualDate = new Date();
  }

  const delayMs = actualDate.getTime() - targetDate.getTime();
  if (delayMs <= 0) {
    return { isDelayed: false, delayMs: 0, delayHours: 0, delayString: '' };
  }

  const totalHours = Math.round(delayMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  let delayString = '';
  if (days > 0) {
    delayString += `${days} day${days > 1 ? 's' : ''}`;
  }
  if (remainingHours > 0) {
    if (delayString) delayString += ', ';
    delayString += `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
  }
  if (!delayString) {
    delayString = `${Math.max(1, Math.round(delayMs / (1000 * 60)))} min`;
  }

  return { isDelayed: true, delayMs, delayHours: totalHours, delayString };
}
