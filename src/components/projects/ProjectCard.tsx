'use client';

import React, { useState } from 'react';
import { FolderKanban, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Project, Task } from '@/types';
import { isOverdue } from '@/lib/validation';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
}

export default function ProjectCard({ project, tasks }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);

  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const overdue = tasks.filter((t) => t.status === 'Overdue' || isOverdue(t.dueDate, t.status)).length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const pending = tasks.length - completed - overdue - inProgress;
  
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4 hover:shadow-md transition-shadow">
      <div 
        className="p-5 cursor-pointer hover:bg-slate-50 transition-colors" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{project.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                project.status === 'Active'
                  ? 'bg-indigo-100 text-indigo-700'
                  : project.status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {project.status}
            </span>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Project Timeline (always visible to give some context) */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg w-fit">
          <div>
            <span className="font-semibold text-slate-600">Start:</span> {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div>
            <span className="font-semibold text-slate-600">Due:</span> {project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50">
          {/* Progress Bar */}
          <div className="mt-4 mb-2">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium text-slate-700">Project Progress</span>
              <span className="font-bold text-indigo-600">{progress}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Task Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col items-center p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
              <span className="text-xs text-slate-500 font-medium mb-1">Total Tasks</span>
              <span className="text-lg font-bold text-slate-800">{tasks.length}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm">
              <span className="text-xs text-emerald-600 font-medium mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
              <span className="text-lg font-bold text-emerald-700">{completed}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
              <span className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Active
              </span>
              <span className="text-lg font-bold text-blue-700">{inProgress + Math.max(0, pending)}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-rose-50 border border-rose-100 shadow-sm">
              <span className="text-xs text-rose-600 font-medium mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Overdue
              </span>
              <span className="text-lg font-bold text-rose-700">{overdue}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
