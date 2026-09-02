'use client';

import React, { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import type { TeamMember, Project, NewTaskForm, TaskStatus, SlipCause } from '@/types';
import { TASK_STATUSES, SLIP_CAUSES, TIME_SLOTS, MAX_TITLE_LENGTH } from '@/types';
import { sanitizeString } from '@/lib/validation';
import { time12To24, time24To12, parseDateWithTime } from '@/lib/trackerEngine';

interface AddTaskFormProps {
  projects: Project[];
  team: TeamMember[];
  onSubmit: (data: NewTaskForm) => Promise<void>;
  loading: boolean;
}

export default function AddTaskForm({ projects, team, onSubmit, loading }: AddTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDueDate, setTargetDueDate] = useState('');
  const [targetDueTime, setTargetDueTime] = useState('10:00 PM');
  const [completedDate, setCompletedDate] = useState('');
  const [completedTime, setCompletedTime] = useState('10:00 PM');
  const [status, setStatus] = useState<TaskStatus>('In Progress');
  const [slipCause, setSlipCause] = useState<SlipCause>('N/A');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      if (!projectId) {
        setError('Please select a project.');
        return;
      }
      if (!assigneeId) {
        setError('Please select a team member / assignee.');
        return;
      }
      if (!title.trim()) {
        setError('Please enter a deliverable description.');
        return;
      }

      let parsedStart: string | undefined;
      if (startDate) {
        const parsed = new Date(startDate);
        if (!isNaN(parsed.getTime())) {
          parsedStart = parsed.toISOString();
        }
      }
      if (!parsedStart) {
        parsedStart = new Date().toISOString();
      }

      let parsedDue: string | undefined;
      if (targetDueDate) {
        const parsed = new Date(targetDueDate);
        if (!isNaN(parsed.getTime())) {
          parsedDue = parsed.toISOString();
        }
      }

      const isComp = status === 'Completed';

      await onSubmit({
        projectId,
        title: sanitizeString(title),
        assigneeId,
        startDate: parsedStart,
        targetDueDate: parsedDue,
        dueDate: parsedDue,
        targetDueTime,
        status,
        slipCause,
        completedDate: isComp ? (completedDate || new Date().toISOString().split('T')[0]) : null,
        completedTime: isComp ? completedTime : null,
        completedAt: isComp ? (parseDateWithTime(completedDate || new Date(), completedTime)?.toISOString() || new Date().toISOString()) : null,
      });

      setTitle('');
      setAssigneeId('');
      setStartDate('');
      setTargetDueDate('');
      setTargetDueTime('10:00 PM');
      setCompletedDate('');
      setCompletedTime('10:00 PM');
      setStatus('In Progress');
      setSlipCause('N/A');
      setError(null);
      setOpen(false);
    } catch (err: any) {
      console.error('Deliverable form submission error:', err);
      setError(err?.message || 'Failed to save deliverable. Please try again.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 cursor-pointer"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Log New Deliverable
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Log New Deliverable</h3>
              <button
                type="button"
                onClick={handleClose}
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
                    Team Member / Assignee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Team Member</option>
                    {team.map((member) => (
                      <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deliverable Name & Scope <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={MAX_TITLE_LENGTH}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Enrolment Agent Decision Control Logic & Notes DB Wiring"
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

              {/* Completion Timestamp (Shown when Completed) */}
              {status === 'Completed' && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Completion Timestamp
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      (Record actual delivery date & time)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Completion Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required={status === 'Completed'}
                        value={completedDate}
                        onChange={(e) => setCompletedDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Completion Time <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={time12To24(completedTime)}
                          onChange={(e) => setCompletedTime(time24To12(e.target.value))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        />
                        <span className="shrink-0 px-2.5 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-xl">
                          {completedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100" role="alert">
                  {error}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
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
                  {loading ? 'Saving Deliverable…' : 'Save Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
