// ─── Task Status & Enums ──────────────────────────────────────────
export type TaskStatus = 'In Progress' | 'Completed' | 'Carried Forward' | 'Cancelled' | 'Blocked' | 'Pending' | 'Overdue';

export const TASK_STATUSES: TaskStatus[] = [
  'In Progress',
  'Completed',
  'Carried Forward',
  'Cancelled',
  'Blocked'
];

export type SlipCause = 
  | 'N/A' 
  | 'Developer' 
  | 'Dependency' 
  | 'Scope Drift' 
  | 'Environment/QA' 
  | 'Unplanned Task';

export const SLIP_CAUSES: SlipCause[] = [
  'N/A',
  'Developer',
  'Dependency',
  'Scope Drift',
  'Environment/QA',
  'Unplanned Task'
];

export const TIME_SLOTS: string[] = [
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
];

export type OnTimeStatus = 'Yes' | 'No' | 'Unverified' | 'Pending';

export type LifecycleStatus = 
  | '🟢 On-Time' 
  | '🟢 In Progress' 
  | '🔴 Delayed' 
  | '🔴 Carried Fwd' 
  | '🔴 Overdue' 
  | '⚪ Cancelled' 
  | '⚠️ Unverified' 
  | '🟢 Not Yet Due';

// ─── Team Member ────────────────────────────────────────────────
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department?: string | null;
  status?: string; // 'Active' | 'Inactive'
  manager?: string | null;
  createdAt: string;
}

export interface NewMemberForm {
  name: string;
  role: string;
  department?: string;
  status?: string;
  manager?: string;
}

// ─── Project ────────────────────────────────────────────────────
export type ProjectStatus = 'Active' | 'Completed' | 'Archived';
export type ProjectPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ProjectHealth = '🟢 On Track (100%)' | '🟡 Active Progress' | '⚪ Inactive / Queue' | '🔴 At Risk';

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  priority?: ProjectPriority | string;
  status: ProjectStatus;
  leadOwner?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
}

export interface NewProjectForm {
  title: string;
  description?: string;
  priority?: ProjectPriority;
  status: ProjectStatus;
  leadOwner?: string;
  startDate?: string;
  targetDate?: string;
}

// ─── Task (15-Column Schema) ────────────────────────────────────
export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  deliverableId?: string | null; // e.g. DLV-000001
  projectId: string;
  assigneeId: string;
  title: string;
  status: TaskStatus;
  slipCause?: SlipCause | string | null;
  startDate?: string | null;
  targetDueDate?: string | null;
  dueDate?: string | null; // alias for targetDueDate
  targetDueTime?: string | null;
  completedDate?: string | null;
  completedTime?: string | null;
  daysActive?: number;
  delayHours?: number;
  onTimeStatus?: OnTimeStatus | string;
  lifecycleStatus?: LifecycleStatus | string;
  labels?: string[] | string;
  checklist?: ChecklistItem[] | string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewTaskForm {
  projectId: string;
  title: string;
  assigneeId: string;
  startDate?: string;
  targetDueDate?: string;
  dueDate?: string;
  targetDueTime?: string;
  status: TaskStatus;
  slipCause?: SlipCause;
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

// ─── Computed / Executive Performance Matrix Data ───────────────
export interface PerformanceData {
  id: string;
  name: string;
  role: string;
  department?: string | null;
  manager?: string | null;
  memberStatus?: string;
  activeTasks: number;
  completedTasks: number;
  onTimeRate: number; // e.g. 0.8 -> 80%
  carriedForward: number;
  slipsLogged: number;
  performanceRating: '🔴 Action Required' | '⚪ Standby' | '🟢 Top Performer' | '🟡 Satisfactory';
  
  // Legacy backward compatibility fields:
  completed?: number;
  overdue?: number;
  inProgress?: number;
  pending?: number;
  total?: number;
  completionRate?: number;
  onTimeCompleted?: number;
  lateCompleted?: number;
  efficiencyScore?: number;
}

export interface ProjectPerformanceData {
  id: string;
  title: string;
  priority: string;
  status: string;
  leadOwner: string;
  activeTasks: number;
  completedTasks: number;
  health: ProjectHealth;
}

export interface TaskMetrics {
  total: number;
  completed: number;
  inProgress: number;
  carriedForward: number;
  blocked: number;
  cancelled: number;
  overdue: number;
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
export const STATUS_STYLES: Record<string, string> = {
  'In Progress': 'text-blue-700 bg-blue-100 border-blue-300',
  'Completed': 'text-emerald-700 bg-emerald-100 border-emerald-300',
  'Carried Forward': 'text-amber-700 bg-amber-100 border-amber-300',
  'Blocked': 'text-rose-700 bg-rose-100 border-rose-300',
  'Cancelled': 'text-slate-600 bg-slate-100 border-slate-300',
  'Pending': 'text-slate-600 bg-slate-100 border-slate-300',
  'Overdue': 'text-rose-700 bg-rose-100 border-rose-300',
};

export const PIE_COLORS: Record<string, string> = {
  'In Progress': '#3b82f6', // Blue 500
  'Completed': '#10b981', // Emerald 500
  'Carried Forward': '#f59e0b', // Amber 500
  'Blocked': '#ef4444', // Red 500
  'Cancelled': '#64748b', // Slate 500
  'Overdue': '#f43f5e',
  'Pending': '#94a3b8',
};

// ─── Constants ──────────────────────────────────────────────────
export const MAX_NAME_LENGTH = 100;
export const MAX_TITLE_LENGTH = 200;
export const MAX_ROLE_LENGTH = 80;
export const MAX_DEPARTMENT_LENGTH = 80;
