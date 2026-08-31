'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { TeamMember, Project, Task, TaskStatus, SlipCause } from '@/types';
import { TASK_STATUSES, SLIP_CAUSES, TIME_SLOTS, MAX_TITLE_LENGTH } from '@/types';
import { sanitizeString } from '@/lib/validation';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projects: Project[];
  team: TeamMember[];
  onSubmit: (taskId: string, data: Partial<Task>) => Promise<void>;
  loading: boolean;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
  projects,
  team,
  onSubmit,
  loading,
}: EditTaskModalProps) {
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDueDate, setTargetDueDate] = useState('');
  const [targetDueTime, setTargetDueTime] = useState('10:00 PM');
  const [status, setStatus] = useState<TaskStatus>('In Progress');
  const [slipCause, setSlipCause] = useState<SlipCause>('N/A');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task && isOpen) {
      setProjectId(task.projectId || '');
      setTitle(task.title || '');
      setAssigneeId(task.assigneeId || '');
      setStatus((task.status as TaskStatus) || 'In Progress');
      setSlipCause((task.slipCause as SlipCause) || 'N/A');
      setTargetDueTime(task.targetDueTime || '10:00 PM');
      setError(null);

      try {
        if (task.startDate) {
          const s = new Date(task.startDate);
          if (!isNaN(s.getTime())) {
            setStartDate(s.toISOString().split('T')[0]);
          }
        }
        const due = task.targetDueDate || task.dueDate;
        if (due) {
          const d = new Date(due);
          if (!isNaN(d.getTime())) {
            setTargetDueDate(d.toISOString().split('T')[0]);
          }
        }
      } catch (e) {}
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!task) return;

    try {
      if (!projectId) {
        setError('Please select a project.');
        return;
      }
      if (!assigneeId) {
        setError('Please select an assignee.');
        return;
      }
      if (!title.trim()) {
        setError('Please enter a deliverable description.');
        return;
      }

      let parsedStart: string | undefined;
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) parsedStart = s.toISOString();
      }

      let parsedDue: string | undefined;
      if (targetDueDate) {
        const d = new Date(targetDueDate);
        if (!isNaN(d.getTime())) parsedDue = d.toISOString();
      }

      await onSubmit(task.id, {
        projectId,
        title: sanitizeString(title),
        assigneeId,
        startDate: parsedStart,
        targetDueDate: parsedDue,
        dueDate: parsedDue,
        targetDueTime,
        status,
        slipCause,
        updatedAt: new Date().toISOString(),
      });

      onClose();
    } catch (err: any) {
      console.error('Edit task error:', err);
      setError(err?.message || 'Failed to update deliverable. Please try again.');
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">Edit Deliverable</h3>
            <span className="font-mono text-xs px-2.5 py-1 bg-slate-200/80 font-bold rounded-lg text-slate-800">
              {task.deliverableId || 'DLV-000000'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
              >
                <option value="">Select Project</option>
                {projects
                  .filter((p) => p.status !== 'Archived')
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assignee <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
              >
                <option value="">Select Member</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Deliverable Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={MAX_TITLE_LENGTH}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={targetDueDate}
                onChange={(e) => setTargetDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Due Time (ETA)
              </label>
              <select
                value={targetDueTime}
                onChange={(e) => setTargetDueTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Slip Cause */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
              >
                {TASK_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Slip Cause (Accountability)
              </label>
              <select
                value={slipCause}
                onChange={(e) => setSlipCause(e.target.value as SlipCause)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
              >
                {SLIP_CAUSES.map((cause) => (
                  <option key={cause} value={cause}>{cause}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100" role="alert">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving…' : 'Update Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
