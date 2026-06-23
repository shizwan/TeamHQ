import { MAX_NAME_LENGTH, MAX_TITLE_LENGTH, MAX_ROLE_LENGTH, MAX_DEPARTMENT_LENGTH } from '@/types';

export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateMemberForm(form: { name: string; role: string; department: string }): string | null {
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

export function validateTaskForm(form: { title: string; assigneeId: string; startDate: string; dueDate: string }): string | null {
  const title = sanitizeString(form.title);

  if (!title) return 'Task title is required.';
  if (title.length > MAX_TITLE_LENGTH) return `Title must be under ${MAX_TITLE_LENGTH} characters.`;
  if (!form.assigneeId) return 'Please select an assignee.';
  if (!form.startDate) return 'Start date is required.';
  if (!form.dueDate) return 'Due date is required.';
  
  const timelineError = validateTimeline(form.startDate, form.dueDate);
  if (timelineError) return timelineError;

  return null;
}

export function validateTimeline(startDate: string, dueDate: string): string | null {
  if (new Date(startDate).getTime() >= new Date(dueDate).getTime()) {
    return 'Start time must be before the due time.';
  }
  return null;
}

export function isOverdue(dueDate: string, status: string): boolean {
  if (status === 'Completed') return false;
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  return due < now;
}

export function getNowString(): string {
  // Returns format YYYY-MM-DDTHH:mm for datetime-local min attribute
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
}

export function getTodayString(): string {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const localISODate = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  return localISODate;
}

export function calculateTaskDelay(task: { dueDate: string; completedAt?: string | null; status: string }): { isDelayed: boolean; delayMs: number; delayString: string } {
  const due = new Date(task.dueDate).getTime();
  let end = Date.now();
  if (task.status === 'Completed' && task.completedAt) {
    end = new Date(task.completedAt).getTime();
  }
  
  if (end <= due) {
    return { isDelayed: false, delayMs: 0, delayString: '' };
  }
  
  const delayMs = end - due;
  const hours = Math.floor(delayMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  let delayString = '';
  if (days > 0) {
    delayString += `${days} day${days > 1 ? 's' : ''}`;
  }
  if (remainingHours > 0) {
    if (delayString) delayString += ', ';
    delayString += `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
  }
  if (!delayString) {
    delayString = '< 1 hour';
  }
  
  return { isDelayed: true, delayMs, delayString };
}
