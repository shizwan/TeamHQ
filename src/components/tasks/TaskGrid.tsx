'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Task, TeamMember, Project, TaskStatus } from '@/types';
import TaskCard from '@/components/tasks/TaskCard';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

interface TaskGridProps {
  tasks: Task[];
  projects?: Project[];
  team: TeamMember[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string, title: string) => void;
}

export default function TaskGrid({
  tasks,
  projects = [],
  team,
  onStatusChange,
  onDelete,
}: TaskGridProps) {
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

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
        const matchesSearch = task.title.toLowerCase().includes(query);
        const matchesProject = selectedProjectId ? task.projectId === selectedProjectId : true;
        return matchesSearch && matchesProject;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [tasks, search, selectedProjectId]);

  const { currentItems: currentTasks, currentPage, totalPages, goToPage } = usePagination(filteredAndSorted, 9);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    goToPage(1);
  }, [search, selectedProjectId, goToPage]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
          />
        </div>
        {projects.length > 0 && (
          <div className="sm:w-64">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              aria-label="Filter by project"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid */}
      {currentTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <p className="text-sm text-slate-500">
            {search ? 'No tasks match your search.' : 'No tasks yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={teamMap[task.assigneeId] ?? 'Unknown'}
                projectName={projectMap[task.projectId]}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))}
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            className="rounded-xl shadow-sm border border-slate-200"
          />
        </div>
      )}
    </div>
  );
}
