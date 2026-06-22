// ─── Task Status ────────────────────────────────────────────────
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export const TASK_STATUSES: TaskStatus[] = ['Pending', 'In Progress', 'Completed', 'Overdue'];

// ─── Team Member ────────────────────────────────────────────────
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  createdAt: string;
}

export interface NewMemberForm {
  name: string;
  role: string;
  department: string;
}

// ─── Project ────────────────────────────────────────────────────
export type ProjectStatus = 'Active' | 'Completed' | 'Archived';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
  createdAt: string;
}

export interface NewProjectForm {
  title: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
}

// ─── Task ───────────────────────────────────────────────────────
export interface Task {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface NewTaskForm {
  projectId: string;
  title: string;
  assigneeId: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
}

// ─── Computed / Derived ─────────────────────────────────────────
export interface PerformanceData {
  id: string;
  name: string;
  role: string;
  department: string;
  createdAt: string;
  completed: number;
  overdue: number;
  inProgress: number;
  pending: number;
  total: number;
  completionRate: number;
  onTimeCompleted: number;
  lateCompleted: number;
  efficiencyScore: number;
}

export interface TaskMetrics {
  total: number;
  completed: number;
  overdue: number;
  inProgress: number;
  pending: number;
}

// ─── UI ─────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

// ─── Status Colors ──────────────────────────────────────────────
export const STATUS_STYLES: Record<TaskStatus, string> = {
  'Pending': 'text-slate-600 bg-slate-100 border-slate-300',
  'In Progress': 'text-blue-700 bg-blue-100 border-blue-300',
  'Completed': 'text-emerald-700 bg-emerald-100 border-emerald-300',
  'Overdue': 'text-rose-700 bg-rose-100 border-rose-300',
};

export const PIE_COLORS: Record<TaskStatus, string> = {
  'In Progress': '#3b82f6',
  'Completed': '#10b981',
  'Overdue': '#f43f5e',
  'Pending': '#94a3b8',
};

// ─── Constants ──────────────────────────────────────────────────
export const MAX_TEAM_SIZE = 25;
export const MAX_NAME_LENGTH = 100;
export const MAX_TITLE_LENGTH = 200;
export const MAX_ROLE_LENGTH = 80;
export const MAX_DEPARTMENT_LENGTH = 80;
