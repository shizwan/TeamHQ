import { z } from 'zod';
import { TASK_STATUSES, SLIP_CAUSES } from '@/types';

// Enums
export const taskStatusEnum = z.enum([
  'In Progress',
  'Completed',
  'Carried Forward',
  'Cancelled',
  'Blocked',
]);

export const slipCauseEnum = z.enum([
  'N/A',
  'Developer',
  'Dependency',
  'Scope Drift',
  'Environment/QA',
  'Unplanned Task',
]);

export const projectStatusEnum = z.enum(['Active', 'Completed', 'Archived']);
export const projectPriorityEnum = z.enum(['Critical', 'High', 'Medium', 'Low']);
export const userRoleEnum = z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']);

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  role: userRoleEnum.default('MEMBER'),
});

export const UpdateUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  role: userRoleEnum.optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// Task Schemas
export const CreateTaskSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  assigneeId: z.string().min(1, 'Assignee is required'),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  status: taskStatusEnum.default('In Progress'),
  slipCause: slipCauseEnum.optional().default('N/A'),
  startDate: z.string().optional().nullable(),
  targetDueDate: z.string().optional().nullable(),
  targetDueTime: z.string().optional().default('10:00 PM'),
  completedDate: z.string().optional().nullable(),
  completedTime: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  labels: z.union([z.array(z.string()), z.string()]).optional().default([]),
  checklist: z.union([z.array(z.object({ text: z.string(), done: z.boolean() })), z.string()]).optional().default([]),
});

export const UpdateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  projectId: z.string().min(1).optional(),
  assigneeId: z.string().min(1).optional(),
  status: taskStatusEnum.optional(),
  slipCause: slipCauseEnum.optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetDueDate: z.string().optional().nullable(),
  targetDueTime: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  completedTime: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  labels: z.union([z.array(z.string()), z.string()]).optional(),
  checklist: z.union([z.array(z.object({ text: z.string(), done: z.boolean() })), z.string()]).optional(),
});

// Project Schemas
export const CreateProjectSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
  description: z.string().trim().max(1000).optional().nullable(),
  priority: projectPriorityEnum.default('High'),
  status: projectStatusEnum.default('Active'),
  leadOwner: z.string().trim().max(100).optional().default('Shizwan'),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export const UpdateProjectSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  priority: projectPriorityEnum.optional(),
  status: projectStatusEnum.optional(),
  leadOwner: z.string().trim().max(100).optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

// Team Member Schemas
export const CreateMemberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  role: z.string().trim().min(1, 'Role is required').max(80, 'Role cannot exceed 80 characters'),
  department: z.string().trim().max(80).optional().nullable(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  manager: z.string().trim().max(100).optional().default('Shizwan'),
});

export const UpdateMemberSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  role: z.string().trim().min(1).max(80).optional(),
  department: z.string().trim().max(80).optional().nullable(),
  status: z.enum(['Active', 'Inactive']).optional(),
  manager: z.string().trim().max(100).optional().nullable(),
});

// Query Schemas
export const TaskQuerySchema = z.object({
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().optional(),
  slipCause: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const ActivityQuerySchema = z.object({
  entityType: z.string().optional(),
  action: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  page: z.coerce.number().int().positive().default(1),
});

export const SearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  category: z.enum(['all', 'tasks', 'projects', 'team']).default('all'),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
