'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, LayoutGrid, Table as TableIcon, Edit2, Trash2 } from 'lucide-react';
import type { Task, TeamMember, Project, TaskStatus } from '@/types';
import TaskCard from '@/components/tasks/TaskCard';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

interface TaskGridProps {
  tasks: Task[];
  projects?: Project[];
  team: TeamMember[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete: (taskId: string, title: string) => void;
}

export default function TaskGrid({
  tasks,
  projects = [],
  team,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskGridProps) {
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const teamMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const member of team) {
      map[member.id] = member.name;
    }
    return map;
  }, [team]);

  const projectMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const project of projects) {
      map[project.id] = project.title;
    }
    return map;
  }, [projects]);

  const filteredAndSorted = useMemo(() => {
    const query = search.toLowerCase();
    return tasks
      .filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(query) || (task.deliverableId || '').toLowerCase().includes(query);
        const matchesProject = selectedProjectId ? task.projectId === selectedProjectId : true;
        return matchesSearch && matchesProject;
      })
      .sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
  }, [tasks, search, selectedProjectId]);

  const { 
    currentItems: currentTasks, 
    currentPage, 
    totalPages, 
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    startItem,
    endItem
  } = usePagination(filteredAndSorted, 15);

  useEffect(() => {
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedProjectId]);

  return (
    <div className="space-y-4">
      {/* Search, Filter & View Toggle Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1 max-w-3xl">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deliverables by name or DLV-ID…"
              className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>
          {projects.length > 0 && (
            <div className="sm:w-64">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              >
                <option value="">All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-4 h-4" /> 15-Col Spreadsheet View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Card View
          </button>
        </div>
      </div>

      {/* Grid or Table Display */}
      {currentTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <p className="text-sm text-slate-500">
            {search ? 'No deliverables match your search query.' : 'No deliverables recorded.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={teamMap[task.assigneeId] ?? 'Unknown'}
                projectName={projectMap[task.projectId]}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            className="rounded-2xl shadow-sm border border-slate-200"
          />
        </div>
      ) : (
        /* 15-COLUMN SPREADSHEET TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">DLV ID</th>
                  <th className="py-3 px-3">Team Member</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-4">Deliverable Name</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">Target Date</th>
                  <th className="py-3 px-3">ETA Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Slip Cause</th>
                  <th className="py-3 px-3 text-center">Days Active</th>
                  <th className="py-3 px-3 text-center">Delay (Hrs)</th>
                  <th className="py-3 px-3 text-center">Lifecycle Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-xs">
                {currentTasks.map((t) => {
                  const memberName = teamMap[t.assigneeId] || 'Unassigned';
                  const projectTitle = projectMap[t.projectId] || 'General';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {t.deliverableId || 'DLV-000000'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">{memberName}</td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{projectTitle}</td>
                      <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">{t.title}</td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.targetDueDate || t.dueDate ? new Date((t.targetDueDate || t.dueDate)!).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.targetDueTime || '10:00 PM'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={t.status}
                          onChange={(e) => onStatusChange(t.id, e.target.value as TaskStatus)}
                          className={`rounded px-2 py-1 text-xs font-bold border ${
                            t.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            t.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                            t.status === 'Carried Forward' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            t.status === 'Blocked' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Carried Forward">Carried Forward</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          (t.slipCause && t.slipCause !== 'N/A') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-400'
                        }`}>
                          {t.slipCause || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                        {t.daysActive || 1}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap font-semibold">
                        {(t.delayHours ?? 0) > 0 ? (
                          <span className="text-rose-600 font-bold">+{t.delayHours} hrs</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                          {t.lifecycleStatus || '🟢 In Progress'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit deliverable"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDelete(t.id, t.title)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Delete deliverable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            className="border-t border-slate-100 p-4"
          />
        </div>
      )}
    </div>
  );
}
