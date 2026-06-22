'use client';

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useAddDoc } from '@/hooks/useFirestore';
import { getProjectsCollectionPath, getTasksCollectionPath } from '@/lib/firestorePaths';
import { useToast } from '@/contexts/ToastContext';
import type { Task, Project, NewProjectForm } from '@/types';
import Header from '@/components/layout/Header';
import ProjectCard from '@/components/projects/ProjectCard';
import AddProjectForm from '@/components/projects/AddProjectForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || '';

  const projectsPath = userId ? getProjectsCollectionPath(userId) : null;
  const tasksPath = userId ? getTasksCollectionPath(userId) : null;

  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsPath);
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksPath);
  
  const { addDocument: addProject, loading: addingProject } = useAddDoc(projectsPath);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase();
    return projects.filter((project) => {
      const matchesSearch = 
        project.title.toLowerCase().includes(query) || 
        (project.description && project.description.toLowerCase().includes(query));
      
      const matchesStatus = statusFilter === 'All' ? true : project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const { currentItems: currentProjects, currentPage, totalPages, goToPage } = usePagination(filteredProjects, 10);

  // Reset pagination when search or filters change
  useEffect(() => {
    goToPage(1);
  }, [search, statusFilter, goToPage]);

  const handleAddProject = useCallback(
    async (data: NewProjectForm) => {
      const now = new Date().toISOString();
      const result = await addProject({
        ...data,
        createdAt: now,
      });

      if (result) {
        addToast('success', 'Project created', `"${data.title}" has been created.`);
        goToPage(1); // Jump to first page to see the new project (assuming sorting puts it there, or just as a reset)
      } else {
        addToast('error', 'Failed to create project', 'Please try again.');
      }
    },
    [addProject, addToast, goToPage]
  );

  if (projectsLoading || tasksLoading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <>
      <Header
        title="Projects Overview"
        description="Create projects and monitor high-level team progress."
      />

      <div className="mb-8">
        <AddProjectForm onSubmit={handleAddProject} loading={addingProject} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mb-6">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
          />
        </div>
        <div className="sm:w-48 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <p className="text-sm text-slate-500">
            {search || statusFilter !== 'All' ? 'No projects match your search.' : 'No projects yet. Create one to get started.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {currentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                tasks={tasks.filter((t) => t.projectId === project.id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              className="rounded-xl shadow-sm border border-slate-200"
            />
          )}
        </div>
      )}
    </>
  );
}
