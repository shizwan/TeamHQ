import React, { useState } from 'react';
import { FolderKanban, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, User, Archive, ArchiveRestore } from 'lucide-react';
import type { Project, Task, ProjectHealth } from '@/types';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onStatusChange?: (projectId: string, newStatus: Project['status']) => void;
}

export default function ProjectCard({ project, tasks, onStatusChange }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const isArchived = project.status === 'Archived';
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const active = tasks.filter((t) => t.status === 'In Progress' || t.status === 'Carried Forward' || t.status === 'Blocked').length;
  const overdue = tasks.filter((t) => (t.delayHours ?? 0) > 0 && t.status !== 'Completed' && t.status !== 'Cancelled').length;

  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate Health
  let health: ProjectHealth = '⚪ Inactive / Queue';
  if (isArchived) {
    health = '⚪ Inactive / Queue';
  } else if (total === 0) {
    health = '⚪ Inactive / Queue';
  } else if (active === 0 && completed > 0) {
    health = '🟢 On Track (100%)';
  } else if (active > 0) {
    health = overdue > 0 ? '🔴 At Risk' : '🟡 Active Progress';
  }

  const priorityColor = 
    project.priority === 'Critical' ? 'bg-rose-100 text-rose-800 border-rose-200' :
    project.priority === 'High' ? 'bg-amber-100 text-amber-800 border-amber-200' :
    project.priority === 'Medium' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className={`rounded-2xl shadow-sm border mb-4 hover:shadow-md transition-all overflow-hidden ${
      isArchived ? 'bg-slate-50/70 border-slate-300 opacity-90' : 'bg-white border-slate-200'
    }`}>
      <div 
        className="p-5 cursor-pointer hover:bg-slate-100/50 transition-colors" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl mt-0.5 ${isArchived ? 'bg-slate-200 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
                {isArchived ? (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                    <Archive className="w-3 h-3" /> Archived
                  </span>
                ) : (
                  <>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${priorityColor}`}>
                      {project.priority || 'High'} Priority
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                      {health}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /> Owner: <strong>{project.leadOwner || 'Shizwan'}</strong></span>
                • <span>Target: {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Ongoing'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStatusChange && (
              <>
                {/* Dedicated Quick Archive / Restore Button */}
                <button
                  type="button"
                  title={isArchived ? "Restore / Unarchive Project" : "Archive Project"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(project.id, isArchived ? 'Active' : 'Archived');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                    isArchived
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {isArchived ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Unarchive</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </>
                  )}
                </button>

                {/* Status Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusMenuOpen(!statusMenuOpen);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all cursor-pointer border border-slate-200"
                  >
                    {project.status}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {statusMenuOpen && (
                    <div 
                      className="absolute right-0 z-10 mt-1.5 w-36 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-1">
                        {['Active', 'Completed', 'Archived'].map((statusOption) => (
                          <button
                            key={statusOption}
                            className={`block w-full px-4 py-2 text-left text-xs font-semibold transition-colors ${
                              project.status === statusOption
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(project.id, statusOption as Project['status']);
                              setStatusMenuOpen(false);
                            }}
                          >
                            {statusOption}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Archival Banner Notice */}
        {isArchived && (
          <div className="mt-3 py-1.5 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Project is archived. Its {total} deliverable(s) are excluded from active scoreboards and performance reports until unarchived.</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1 font-semibold">
            <span className="text-slate-600">Completion Parity</span>
            <span className="text-indigo-600">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isArchived ? 'bg-slate-400' : 'bg-indigo-600'}`} 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-200/60 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-sm">
              <span className="text-xs text-slate-500 font-medium mb-0.5">Total Deliverables</span>
              <span className="text-base font-bold text-slate-900">{total}</span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
              <span className="text-xs text-emerald-700 font-medium mb-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
              <span className="text-base font-bold text-emerald-800">{completed}</span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
              <span className="text-xs text-blue-700 font-medium mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Active
              </span>
              <span className="text-base font-bold text-blue-800">{active}</span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-rose-50 border border-rose-100 shadow-sm">
              <span className="text-xs text-rose-700 font-medium mb-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Overdue
              </span>
              <span className="text-base font-bold text-rose-800">{overdue}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
