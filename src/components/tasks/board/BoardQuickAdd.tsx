'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import type { TeamMember, Project } from '@/types';

interface BoardQuickAddProps {
  onAdd: (title: string, projectId: string, assigneeId: string) => void;
  projects: Project[];
  team: TeamMember[];
  placeholder?: string;
}

export default function BoardQuickAdd({ onAdd, projects, team, placeholder = 'Enter a title for this card…' }: BoardQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  
  // Set sensible defaults if available
  const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
  const [assigneeId, setAssigneeId] = useState(team.length > 0 ? team[0].id : '');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed || !projectId || !assigneeId) return;
    onAdd(trimmed, projectId, assigneeId);
    setTitle('');
    // Keep form open for rapid entry
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setTitle('');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTitle('');
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add another card
      </button>
    );
  }

  return (
    <div className="space-y-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-colors resize-none shadow-sm"
      />
      
      <div className="flex gap-2">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
        >
          <option value="" disabled>Project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
        >
          <option value="" disabled>Assignee...</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-200 mt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || !projectId || !assigneeId}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Card
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
