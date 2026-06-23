'use client';

import React from 'react';
import { Trash2, Users, Edit2 } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import { TASK_STATUSES } from '@/types';
import { isOverdue } from '@/lib/validation';
import StatusBadge from '@/components/ui/StatusBadge';

interface TaskCardProps {
  task: Task;
  assigneeName: string;
  projectName?: string;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string, title: string) => void;
  onEdit?: (task: Task) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TaskCard({
  task,
  assigneeName,
  projectName,
  onStatusChange,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <article className="group bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
      {/* Top row: badge + status select + delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />

          <select
            value={task.status}
            onChange={(e) =>
              onStatusChange(task.id, e.target.value as TaskStatus)
            }
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            aria-label={`Change status for task: ${task.title}`}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="inline-flex items-center rounded-md p-1.5 text-slate-400 transition-all hover:text-indigo-500 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              aria-label={`Edit task: ${task.title}`}
            >
              <Edit2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(task.id, task.title)}
            className="inline-flex items-center rounded-md p-1.5 text-slate-400 transition-all hover:text-rose-500 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
            aria-label={`Delete task: ${task.title}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Project Name & Title */}
      {projectName && (
        <div className="mt-4 mb-1 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          {projectName}
        </div>
      )}
      <h4 className={`${projectName ? 'mt-0' : 'mt-3'} font-semibold text-slate-800 line-clamp-2`}>
        {task.title}
      </h4>

      {/* Assignee */}
      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{assigneeName}</span>
      </div>

      {/* Dates + overdue badge */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-8 font-semibold text-slate-600">Start:</span>
          <span>{formatDate(task.startDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-8 font-semibold text-slate-600">Due:</span>
          <span className="flex-1">{formatDate(task.dueDate)}</span>
          {overdue && (
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-rose-700">
              Past due
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
