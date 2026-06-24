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
  dueDate?: string | null;
  createdAt: string;
}

export interface NewProjectForm {
  title: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  dueDate?: string | null;
}

// ─── Task ───────────────────────────────────────────────────────
export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  labels?: string[];
  checklist?: ChecklistItem[];
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
  labels?: string[];
  checklist?: ChecklistItem[];
}

// ─── Labels ─────────────────────────────────────────────────────
export interface LabelPreset {
  name: string;
  color: string;      // tailwind bg class
  textColor: string;   // tailwind text class
}

export const LABEL_PRESETS: LabelPreset[] = [
  { name: 'Bug', color: 'bg-rose-500', textColor: 'text-white' },
  { name: 'Enhancement', color: 'bg-emerald-500', textColor: 'text-white' },
  { name: 'Polish', color: 'bg-violet-500', textColor: 'text-white' },
  { name: 'Documentation', color: 'bg-sky-500', textColor: 'text-white' },
  { name: 'Mandatory', color: 'bg-amber-500', textColor: 'text-white' },
  { name: 'Feature', color: 'bg-indigo-500', textColor: 'text-white' },
  { name: 'Urgent', color: 'bg-red-600', textColor: 'text-white' },
  { name: 'Design', color: 'bg-pink-500', textColor: 'text-white' },
];

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
  'In Progress': '#6260f3', // Brand Primary
  'Completed': '#00c7e2', // Brand Secondary (Cyan)
  'Overdue': '#f43f5e', // Rose 500
  'Pending': '#94a3b8', // Slate 400
};

// ─── Constants ──────────────────────────────────────────────────
export const MAX_NAME_LENGTH = 100;
export const MAX_TITLE_LENGTH = 200;
export const MAX_ROLE_LENGTH = 80;
export const MAX_DEPARTMENT_LENGTH = 80;
