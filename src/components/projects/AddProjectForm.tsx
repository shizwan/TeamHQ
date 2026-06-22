'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { NewProjectForm } from '@/types';
import { sanitizeString } from '@/lib/validation';

interface AddProjectFormProps {
  onSubmit: (data: NewProjectForm) => Promise<void>;
  loading: boolean;
}

export default function AddProjectForm({ onSubmit, loading }: AddProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    if (!startDate || !startTime || !dueDate || !dueTime) {
      setError('Both start and due dates and times are required.');
      return;
    }

    const combinedStart = `${startDate}T${startTime}`;
    const combinedDue = `${dueDate}T${dueTime}`;

    if (new Date(combinedStart).getTime() >= new Date(combinedDue).getTime()) {
      setError('Start time must be before the due time.');
      return;
    }

    await onSubmit({
      title: sanitizeString(title),
      description: sanitizeString(description),
      status: 'Active',
      startDate: combinedStart,
      dueDate: combinedDue,
    });

    setTitle('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setDueDate('');
    setDueTime('');
    setError(null);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        aria-expanded={open}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Create New Project
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
        >
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="project-title" className="text-sm font-medium text-slate-700">
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
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="project-description" className="text-sm font-medium text-slate-700">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-description"
              type="text"
              required
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Complete overhaul of the landing page"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
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
                aria-label="Project start date"
              />
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Project start time"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Due Date & Time <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Project due date"
              />
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Project due time"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create Project'}
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
