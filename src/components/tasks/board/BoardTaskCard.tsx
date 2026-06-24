'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical, Trash2, Edit2, CheckCircle2, ListChecks } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import { LABEL_PRESETS } from '@/types';
import { isOverdue } from '@/lib/validation';

interface BoardTaskCardProps {
  task: Task;
  assigneeName: string;
  projectName?: string;
  onEdit?: (task: Task) => void;
  onDelete: (taskId: string, title: string) => void;
  onQuickComplete?: (taskId: string) => void;
}

const STATUS_ACCENT: Record<TaskStatus, string> = {
  Pending: 'border-l-slate-400',
  'In Progress': 'border-l-indigo-500',
  Completed: 'border-l-emerald-500',
  Overdue: 'border-l-rose-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getLabelStyle(labelName: string) {
  const preset = LABEL_PRESETS.find((p) => p.name === labelName);
  if (preset) return { bg: preset.color, text: preset.textColor };
  return { bg: 'bg-slate-400', text: 'text-white' };
}

export default function BoardTaskCard({
  task,
  assigneeName,
  projectName,
  onEdit,
  onDelete,
  onQuickComplete,
}: BoardTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.dueDate, task.status);
  const isCompleted = task.status === 'Completed';
  const labels = task.labels || [];
  const checklist = task.checklist || [];
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistTotal = checklist.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-lg border-l-[3px] border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${STATUS_ACCENT[task.status]} ${isDragging ? 'opacity-50 shadow-lg scale-105 z-50' : ''} ${isCompleted ? 'opacity-70' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="p-3">
        {/* Labels row */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labels.map((label) => {
              const style = getLabelStyle(label);
              return (
                <span
                  key={label}
                  className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Title */}
        <h4 className={`text-sm font-semibold line-clamp-2 leading-snug pr-1 ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </h4>

        {/* Project tag */}
        {projectName && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1.5">
            {projectName}
          </span>
        )}

        {/* Footer: Due date + checklist + Assignee/Actions */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due date */}
            <div
              className={`flex items-center gap-1 text-[11px] font-medium ${
                overdue ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{formatShortDate(task.dueDate)}</span>
              {overdue && (
                <span className="bg-rose-100 text-rose-700 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                  Late
                </span>
              )}
            </div>

            {/* Checklist progress */}
            {checklistTotal > 0 && (
              <div
                className={`flex items-center gap-1 text-[11px] font-medium ${
                  checklistDone === checklistTotal ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <ListChecks className="w-3 h-3" />
                <span>{checklistDone}/{checklistTotal}</span>
              </div>
            )}
          </div>

          {/* Right side: Avatar (default) / Actions (hover) */}
          <div className="flex items-center gap-1">
            {/* Assignee avatar — hidden on hover */}
            <div className="group-hover:hidden flex items-center" title={assigneeName}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                {getInitials(assigneeName)}
              </div>
            </div>

            {/* Action buttons — shown on hover */}
            <div className="hidden group-hover:flex items-center gap-0.5">
              {onQuickComplete && !isCompleted && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onQuickComplete(task.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                  aria-label={`Mark complete: ${task.title}`}
                  title="Mark complete"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                  aria-label={`Edit task: ${task.title}`}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(task.id, task.title); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                aria-label={`Delete task: ${task.title}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
