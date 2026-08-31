'use client';

import React from 'react';
import { Trash2, Users, Edit2, Eye } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import { TASK_STATUSES, STATUS_STYLES } from '@/types';
import { isOverdue } from '@/lib/validation';

interface TaskCardProps {
  task: Task;
  assigneeName: string;
  projectName?: string;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string, title: string) => void;
  onEdit?: (task: Task) => void;
  onPreview?: (task: Task) => void;
}

function formatDate(dateString?: string | null, timeString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    const formatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (timeString) {
      return `${formatted}, ${timeString}`;
    }
    return formatted;
  } catch {
    return '-';
  }
}

export default function TaskCard({
  task,
  assigneeName,
  projectName,
  onStatusChange,
  onDelete,
  onEdit,
  onPreview,
}: TaskCardProps) {
  const overdue = (task.delayHours ?? 0) > 0 || isOverdue(task.targetDueDate || task.dueDate || '', task.status);

  return (
    <article className="group bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <div>
        {/* Top row: unified status select dropdown + preview/edit/delete buttons */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <select
              value={task.status}
              onChange={(e) =>
                onStatusChange(task.id, e.target.value as TaskStatus)
              }
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer max-w-full truncate transition-colors ${
                STATUS_STYLES[task.status] || 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              aria-label={`Change status for task: ${task.title}`}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-white text-slate-800 font-medium">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onPreview && (
              <button
                type="button"
                onClick={() => onPreview(task)}
                className="inline-flex items-center rounded-lg p-1.5 text-slate-400 transition-all hover:text-indigo-600 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 cursor-pointer"
                aria-label={`Preview task: ${task.title}`}
                title="Preview deliverable"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="inline-flex items-center rounded-lg p-1.5 text-slate-400 transition-all hover:text-indigo-600 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 cursor-pointer"
                aria-label={`Edit task: ${task.title}`}
                title="Edit task"
              >
                <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(task.id, task.title)}
              className="inline-flex items-center rounded-lg p-1.5 text-slate-400 transition-all hover:text-rose-600 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 cursor-pointer"
              aria-label={`Delete task: ${task.title}`}
              title="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Project Name & Title */}
        {projectName && (
          <div className="mt-3.5 mb-1 text-[11px] font-bold text-indigo-600 uppercase tracking-wider truncate">
            {projectName}
          </div>
        )}
        <h4 
          onClick={() => onPreview && onPreview(task)}
          className={`${projectName ? 'mt-0' : 'mt-3'} font-semibold text-slate-800 line-clamp-2 text-sm leading-snug ${onPreview ? 'hover:text-indigo-600 cursor-pointer transition-colors' : ''}`}
        >
          {task.title}
        </h4>

        {/* Assignee */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{assigneeName}</span>
        </div>
      </div>

      {/* Dates + overdue badge */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-9 font-semibold text-slate-600 shrink-0">Start:</span>
          <span className="truncate">{formatDate(task.startDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-9 font-semibold text-slate-600 shrink-0">Due:</span>
          <span className="flex-1 truncate">{formatDate(task.targetDueDate || task.dueDate, task.targetDueTime)}</span>
          {overdue && (
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 shrink-0">
              Past due
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
