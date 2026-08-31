import { MAX_NAME_LENGTH, MAX_TITLE_LENGTH, MAX_ROLE_LENGTH, MAX_DEPARTMENT_LENGTH } from '@/types';
import type { TeamMember, Task, PerformanceData } from '@/types';
import { calculateTeamPerformance, calculateTaskDelayDetailed, parseDateWithTime } from '@/lib/trackerEngine';

export function sanitizeString(value: string): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

export function validateMemberForm(form: { name: string; role: string; department?: string | null }): string | null {
  const name = sanitizeString(form.name);
  const role = sanitizeString(form.role);

  if (!name) return 'Name is required.';
  if (name.length > MAX_NAME_LENGTH) return `Name must be under ${MAX_NAME_LENGTH} characters.`;
  if (!role) return 'Role is required.';
  if (role.length > MAX_ROLE_LENGTH) return `Role must be under ${MAX_ROLE_LENGTH} characters.`;
  if (form.department && sanitizeString(form.department).length > MAX_DEPARTMENT_LENGTH) {
    return `Department must be under ${MAX_DEPARTMENT_LENGTH} characters.`;
  }

  return null;
}

export function validateTaskForm(form: { 
  title: string; 
  assigneeId: string; 
  startDate?: string | Date | null; 
  dueDate?: string | Date | null;
  targetDueDate?: string | Date | null;
}): string | null {
  const title = sanitizeString(form.title || '');

  if (!title) return 'Deliverable title is required.';
  if (title.length > MAX_TITLE_LENGTH) return `Title must be under ${MAX_TITLE_LENGTH} characters.`;
  if (!form.assigneeId) return 'Please select an assignee.';
  
  const due = form.targetDueDate || form.dueDate;
  if (form.startDate && due) {
    const timelineError = validateTimeline(form.startDate, due);
    if (timelineError) return timelineError;
  }

  return null;
}

export function validateTimeline(startDate: string | Date, dueDate: string | Date): string | null {
  const start = new Date(startDate).getTime();
  const due = new Date(dueDate).getTime();
  if (!isNaN(start) && !isNaN(due) && start > due) {
    return 'Start date cannot be after the target due date.';
  }
  return null;
}

export function isOverdue(dueDate?: string | Date | null, status?: string): boolean {
  if (!dueDate || status === 'Completed' || status === 'Cancelled') return false;
  const targetDate = parseDateWithTime(dueDate, '10:00 PM');
  if (!targetDate) return false;
  return targetDate.getTime() < Date.now();
}

export function getNowString(): string {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
}

export function getTodayString(): string {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const localISODate = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  return localISODate;
}

/**
 * Checks whether a given task or date belongs to a target month (format YYYY-MM)
 */
export function matchesMonth(dateInput?: string | Date | null, selectedMonth?: string): boolean {
  if (!selectedMonth || selectedMonth === 'All') return true;
  if (!dateInput) return false;

  if (typeof dateInput === 'string') {
    // If it's already ISO format like 2026-08-25
    if (dateInput.startsWith(selectedMonth)) return true;
    const parsed = new Date(dateInput);
    if (isNaN(parsed.getTime())) return false;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}` === selectedMonth;
  } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}` === selectedMonth;
  }

  return false;
}

export function calculateTaskDelay(task: { 
  dueDate?: string | Date | null; 
  targetDueDate?: string | Date | null;
  targetDueTime?: string | null;
  completedDate?: string | Date | null;
  completedTime?: string | null;
  completedAt?: string | Date | null; 
  status: string 
}): { isDelayed: boolean; delayMs: number; delayString: string } {
  const due = task.targetDueDate || task.dueDate;
  const compDate = task.completedDate || task.completedAt;
  const detailed = calculateTaskDelayDetailed(due, task.targetDueTime, compDate, task.completedTime, task.status);
  return {
    isDelayed: detailed.isDelayed,
    delayMs: detailed.delayMs,
    delayString: detailed.delayString,
  };
}

export function calculatePerformanceData(team: TeamMember[], tasks: Task[]): PerformanceData[] {
  return calculateTeamPerformance(team, tasks);
}
