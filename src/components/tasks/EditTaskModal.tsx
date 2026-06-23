'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { TeamMember, Project, Task } from '@/types';
import { MAX_TITLE_LENGTH } from '@/types';
import { validateTaskForm, sanitizeString } from '@/lib/validation';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projects: Project[];
  team: TeamMember[];
  onSubmit: (taskId: string, data: Partial<Task>) => Promise<void>;
  loading: boolean;
}

export default function EditTaskModal({ isOpen, onClose, task, projects, team, onSubmit, loading }: EditTaskModalProps) {
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task && isOpen) {
      setProjectId(task.projectId || '');
      setTitle(task.title);
      setAssigneeId(task.assigneeId);
      
      try {
        const start = new Date(task.startDate);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
        
        const due = new Date(task.dueDate);
        setDueDate(due.toISOString().split('T')[0]);
        setDueTime(due.toTimeString().slice(0, 5));
      } catch (e) {
        // Date parsing error, shouldn't happen with valid ISO strings
      }
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!task) return;

    if (!projectId) {
      setError('Please select a project.');
      return;
    }

    if (!startDate || !startTime || !dueDate || !dueTime) {
      setError('Both start and due dates and times are required.');
      return;
    }

    const combinedStart = new Date(`${startDate}T${startTime}`).toISOString();
    const combinedDue = new Date(`${dueDate}T${dueTime}`).toISOString();

    const validationError = validateTaskForm({ 
      title, 
      assigneeId, 
      startDate: combinedStart,
      dueDate: combinedDue 
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    await onSubmit(task.id, {
      projectId,
      title: sanitizeString(title),
      assigneeId,
      startDate: combinedStart,
      dueDate: combinedDue,
      updatedAt: new Date().toISOString()
    });

    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Edit Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="edit-task-modal"
          onSubmit={handleSubmit}
          className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
        >
          {/* Project */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="edit-task-project" className="text-sm font-medium text-slate-700">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              id="edit-task-project"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Task Description */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="edit-task-title" className="text-sm font-medium text-slate-700">
              Task Description <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-task-title"
              type="text"
              required
              maxLength={MAX_TITLE_LENGTH}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Redesign landing page"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="edit-task-assignee" className="text-sm font-medium text-slate-700">
              Assignee <span className="text-rose-500">*</span>
            </label>
            <select
              id="edit-task-assignee"
              required
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            >
              <option value="">Select member</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date & Time */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <label className="text-sm font-medium text-slate-700">
              Start Date & Time <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Task start date"
              />
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Task start time"
              />
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <label className="text-sm font-medium text-slate-700">
              Deadline & Time <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Task due date"
              />
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Task due time"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-3 md:col-span-6 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {error && (
            <p className="col-span-full text-sm text-rose-600 font-medium bg-rose-50 p-3 rounded-lg border border-rose-100" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
