'use client';

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import type { NewProjectForm, ProjectPriority } from '@/types';
import { sanitizeString } from '@/lib/validation';

interface AddProjectFormProps {
  onSubmit: (data: NewProjectForm) => Promise<void>;
  loading: boolean;
}

export default function AddProjectForm({ onSubmit, loading }: AddProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('High');
  const [leadOwner, setLeadOwner] = useState('Shizwan');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      if (!title.trim() || !description.trim()) {
        setError('Title and description are required.');
        return;
      }

      let combinedStart: string | undefined;
      if (startDate) {
        const timeVal = startTime || '09:00';
        const parsed = new Date(`${startDate}T${timeVal}`);
        if (isNaN(parsed.getTime())) {
          setError('Please provide a valid start date and time.');
          return;
        }
        combinedStart = parsed.toISOString();
      } else {
        combinedStart = new Date().toISOString();
      }

      let combinedDue: string | undefined;
      if (dueDate) {
        const timeVal = dueTime || '17:00';
        const parsed = new Date(`${dueDate}T${timeVal}`);
        if (isNaN(parsed.getTime())) {
          setError('Please provide a valid due date and time.');
          return;
        }
        combinedDue = parsed.toISOString();

        if (combinedStart && new Date(combinedStart).getTime() >= parsed.getTime()) {
          setError('Start time must be before the due time.');
          return;
        }
      }

      await onSubmit({
        title: sanitizeString(title),
        description: sanitizeString(description),
        priority,
        leadOwner: sanitizeString(leadOwner) || 'Shizwan',
        status: 'Active',
        startDate: combinedStart,
        targetDate: combinedDue,
      });

      setTitle('');
      setDescription('');
      setPriority('High');
      setLeadOwner('Shizwan');
      setStartDate('');
      setStartTime('');
      setDueDate('');
      setDueTime('');
      setError(null);
      setOpen(false);
    } catch (err: any) {
      console.error('Project form submission error:', err);
      setError(err?.message || 'Failed to create project. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 cursor-pointer"
        aria-expanded={open}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {open ? 'Close Project Form' : 'Create New Project'}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-end animate-in fade-in duration-150"
        >
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="project-title" className="text-sm font-semibold text-slate-700">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="project-description" className="text-sm font-semibold text-slate-700">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-description"
              type="text"
              required
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Complete overhaul of the landing page and backend portal"
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-priority" className="text-sm font-semibold text-slate-700">
              Priority
            </label>
            <select
              id="project-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ProjectPriority)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-lead" className="text-sm font-semibold text-slate-700">
              Lead Owner
            </label>
            <input
              id="project-lead"
              type="text"
              value={leadOwner}
              onChange={(e) => setLeadOwner(e.target.value)}
              placeholder="e.g. Shizwan"
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Start Date & Time (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Project start date"
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Project start time"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Due Date & Time (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Project due date"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Project due time"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating Project…' : 'Create Project'}
            </button>
          </div>

          {error && (
            <p className="col-span-full text-sm text-rose-600 font-medium" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
