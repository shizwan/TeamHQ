'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Edit2,
  Trash2,
  Tag,
  CheckSquare,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { Task, Project, TeamMember, TaskStatus } from '@/types';
import { STATUS_STYLES, TASK_STATUSES, LABEL_PRESETS } from '@/types';

interface TaskPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projects?: Project[];
  team?: TeamMember[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string, title: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export default function TaskPreviewModal({
  isOpen,
  onClose,
  task,
  projects = [],
  team = [],
  onEdit,
  onDelete,
  onStatusChange,
}: TaskPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = team.find((m) => m.id === task.assigneeId);

  // Parse labels
  let labels: string[] = [];
  if (Array.isArray(task.labels)) {
    labels = task.labels;
  } else if (typeof task.labels === 'string') {
    try {
      labels = JSON.parse(task.labels);
    } catch {
      labels = [];
    }
  }

  // Parse checklist
  let checklist: { text: string; done: boolean }[] = [];
  if (Array.isArray(task.checklist)) {
    checklist = task.checklist;
  } else if (typeof task.checklist === 'string') {
    try {
      checklist = JSON.parse(task.checklist);
    } catch {
      checklist = [];
    }
  }

  const completedChecklistCount = checklist.filter((item) => item.done).length;
  const checklistPercent =
    checklist.length > 0 ? Math.round((completedChecklistCount / checklist.length) * 100) : 0;

  const handleCopyId = () => {
    const idToCopy = task.deliverableId || task.id;
    navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not set';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Not set';
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Not set';
    }
  };

  const isDelay = (task.delayHours ?? 0) > 0;
  const isCompleted = task.status === 'Completed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-preview-title"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              {/* Deliverable ID Chip */}
              <button
                type="button"
                onClick={handleCopyId}
                className="group/copy inline-flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Click to copy DLV ID"
              >
                <span>{task.deliverableId || 'DLV-000000'}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-indigo-400 group-hover/copy:text-indigo-600 transition-colors" />
                )}
              </button>

              {/* Status Selector */}
              {onStatusChange ? (
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors ${
                    STATUS_STYLES[task.status] || 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  aria-label="Change status"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-white text-slate-800 font-medium">
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    STATUS_STYLES[task.status] || 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {task.status}
                </span>
              )}

              {/* Lifecycle Status Pill */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                {task.lifecycleStatus || '🟢 In Progress'}
              </span>

              {/* Slip Cause Pill */}
              {task.slipCause && task.slipCause !== 'N/A' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Slip: {task.slipCause}
                </span>
              )}
            </div>

            <h2
              id="task-preview-title"
              className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words"
            >
              {task.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Key Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Project
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {project?.title || 'General / Unassigned'}
                </p>
                {project?.leadOwner && (
                  <p className="text-xs text-slate-500 mt-0.5">Lead: {project.leadOwner}</p>
                )}
              </div>
            </div>

            {/* Assignee Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Assignee
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {assignee?.name || 'Unassigned'}
                </p>
                {assignee?.role && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {assignee.role} {assignee.department ? `• ${assignee.department}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline & ETA Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Timeline & Delivery Metrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block">Start Date</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1 block truncate">
                  {formatDate(task.startDate)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block">Target ETA</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1 block truncate">
                  {formatDate(task.targetDueDate || task.dueDate)}
                </span>
                <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                  {task.targetDueTime || '10:00 PM'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block">Days Active</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1 block">
                  {task.daysActive || 1} day{task.daysActive !== 1 ? 's' : ''}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDelay
                    ? 'bg-rose-50 border-rose-100 text-rose-700'
                    : isCompleted
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
              >
                <span className="text-[11px] font-semibold opacity-80 block">Delay Status</span>
                <span className="text-xs sm:text-sm font-bold mt-1 block">
                  {isDelay
                    ? `+${task.delayHours} hrs Late`
                    : isCompleted
                    ? 'Delivered On Time'
                    : 'On Track (0h)'}
                </span>
              </div>
            </div>
          </div>

          {/* Checklist Section */}
          {checklist.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  Deliverable Checklist ({completedChecklistCount}/{checklist.length})
                </h3>
                <span className="text-xs font-bold text-indigo-600">{checklistPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3.5">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100"
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-0.5 ${
                        item.done
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={item.done ? 'line-through text-slate-400' : 'text-slate-800'}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labels & Tags */}
          {labels.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Labels & Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => {
                  const preset = LABEL_PRESETS.find((p) => p.name === label);
                  return (
                    <span
                      key={label}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        preset
                          ? `${preset.color} ${preset.textColor}`
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(task.id, task.title);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Close
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Deliverable</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
