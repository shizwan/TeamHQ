'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import type { TeamMember, Project, ChecklistItem, TaskStatus, NewTaskForm } from '@/types';
import { MAX_TITLE_LENGTH, LABEL_PRESETS } from '@/types';
import { validateTaskForm, sanitizeString } from '@/lib/validation';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus | null;
  projects: Project[];
  team: TeamMember[];
  onSubmit: (data: NewTaskForm) => Promise<void>;
  loading: boolean;
}

export default function AddTaskModal({
  isOpen,
  onClose,
  defaultStatus,
  projects,
  team,
  onSubmit,
  loading,
}: AddTaskModalProps) {
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectId(projects.length > 0 ? projects[0].id : '');
      setTitle('');
      setAssigneeId(team.length > 0 ? team[0].id : '');
      setLabels([]);
      setChecklist([]);
      setNewChecklistItem('');
      setError(null);

      const now = new Date();
      setStartDate(now.toISOString().split('T')[0]);
      setStartTime('09:00');

      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setDueDate(nextWeek.toISOString().split('T')[0]);
      setDueTime('17:00');
    }
  }, [isOpen, projects, team]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

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
        setError('Please enter a task title.');
        return;
      }

      let combinedStart: string | undefined;
      if (startDate) {
        const timeVal = startTime || '09:00';
        const parsed = new Date(`${startDate}T${timeVal}`);
        if (!isNaN(parsed.getTime())) {
          combinedStart = parsed.toISOString();
        }
      }
      if (!combinedStart) combinedStart = new Date().toISOString();

      let combinedDue: string | undefined;
      if (dueDate) {
        const timeVal = dueTime || '17:00';
        const parsed = new Date(`${dueDate}T${timeVal}`);
        if (!isNaN(parsed.getTime())) {
          combinedDue = parsed.toISOString();
        }
      }

      const validationError = validateTaskForm({
        title,
        assigneeId,
        startDate: combinedStart,
        dueDate: combinedDue,
      });

      if (validationError) {
        setError(validationError);
        return;
      }

      await onSubmit({
        projectId,
        title: sanitizeString(title),
        assigneeId,
        startDate: combinedStart,
        targetDueDate: combinedDue,
        dueDate: combinedDue,
        targetDueTime: dueTime ? dueTime : '10:00 PM',
        status: defaultStatus || 'In Progress',
        labels,
        checklist,
      });

      onClose();
    } catch (err: any) {
      console.error('Task submission error:', err);
      setError(err?.message || 'Failed to create task. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Add New Deliverable</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="add-task-modal"
          onSubmit={handleSubmit}
          className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
        >
          {/* Project */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <label htmlFor="add-task-project" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              id="add-task-project"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">Select project</option>
              {projects
                .filter((p) => p.status !== 'Archived')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <label htmlFor="add-task-assignee" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Assignee <span className="text-rose-500">*</span>
            </label>
            <select
              id="add-task-assignee"
              required
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">Select member</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          {/* Task Description */}
          <div className="flex flex-col gap-1.5 md:col-span-6">
            <label htmlFor="add-task-title" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Deliverable Title & Scope <span className="text-rose-500">*</span>
            </label>
            <input
              id="add-task-title"
              type="text"
              required
              maxLength={MAX_TITLE_LENGTH}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Database schema optimization for student headcount audit"
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Start Date & Time */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Start Date & Time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Task start date"
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Task start time"
              />
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Deadline & Time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Task due date"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                aria-label="Task due time"
              />
            </div>
          </div>

          {/* Labels */}
          <div className="flex flex-col gap-1.5 md:col-span-6">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Labels</label>
            <div className="flex flex-wrap gap-2">
              {LABEL_PRESETS.map((preset) => {
                const isActive = labels.includes(preset.name);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setLabels(labels.filter((l) => l !== preset.name));
                      } else {
                        setLabels([...labels, preset.name]);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                      isActive
                        ? `${preset.color} ${preset.textColor} border-transparent shadow-sm scale-105`
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3" />}
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-1.5 md:col-span-6">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Checklist {checklist.length > 0 && <span className="text-slate-400">({checklist.filter((c) => c.done).length}/{checklist.length})</span>}
            </label>
            <div className="space-y-1.5">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...checklist];
                      updated[idx] = { ...updated[idx], done: !updated[idx].done };
                      setChecklist(updated);
                    }}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                      item.done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {item.done && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`text-sm flex-1 ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
                    className="p-0.5 rounded text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newChecklistItem.trim();
                      if (trimmed) {
                        setChecklist([...checklist, { text: trimmed, done: false }]);
                        setNewChecklistItem('');
                      }
                    }
                  }}
                  placeholder="Add checklist item…"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newChecklistItem.trim();
                    if (trimmed) {
                      setChecklist([...checklist, { text: trimmed, done: false }]);
                      setNewChecklistItem('');
                    }
                  }}
                  disabled={!newChecklistItem.trim()}
                  className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Add checklist item"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="col-span-full text-sm text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-3 md:col-span-6 border-t border-slate-100 mt-2">
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving…' : 'Add Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
