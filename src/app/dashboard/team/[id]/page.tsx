'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Briefcase, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useUpdateDoc, useDeleteDoc } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { isOverdue } from '@/lib/validation';
import type { TeamMember, Task, PerformanceData, TaskStatus, Project } from '@/types';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MetricCard from '@/components/dashboard/MetricCard';
import PerformanceBarChart from '@/components/dashboard/PerformanceBarChart';
import TaskCard from '@/components/tasks/TaskCard';
import EmptyState from '@/components/ui/EmptyState';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function TeammateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const userId = user?.uid || '';

  const { data: team, loading: teamLoading } = useCollection<TeamMember>(
    userId ? getTeamCollectionPath(userId) : null
  );
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(
    userId ? getTasksCollectionPath(userId) : null
  );
  const { data: projects, loading: projectsLoading } = useCollection<Project>(
    userId ? getProjectsCollectionPath(userId) : null
  );

  const { updateDocument } = useUpdateDoc(userId ? getTasksCollectionPath(userId) : null);
  const { deleteDocument } = useDeleteDoc(userId ? getTasksCollectionPath(userId) : null);

  const member = useMemo(() => team.find((m) => m.id === id), [team, id]);
  const memberTasks = useMemo(() => tasks.filter((t) => t.assigneeId === id), [tasks, id]);

  const { currentItems: currentTasks, currentPage, totalPages, goToPage } = usePagination(memberTasks, 6);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of projects) {
      map[project.id] = project.title;
    }
    return map;
  }, [projects]);

  const performance: PerformanceData | null = useMemo(() => {
    if (!member) return null;
    const completedTasks = memberTasks.filter((t) => t.status === 'Completed');
    const completed = completedTasks.length;
    const overdue = memberTasks.filter(
      (t) => t.status === 'Overdue' || isOverdue(t.dueDate, t.status)
    ).length;
    const inProgress = memberTasks.filter((t) => t.status === 'In Progress').length;
    const pending = memberTasks.length - completed - overdue - inProgress;
    const total = memberTasks.length;

    const onTimeCompleted = completedTasks.filter(t => t.completedAt && t.completedAt <= t.dueDate).length + completedTasks.filter(t => !t.completedAt).length; // assume on-time if missing timestamp
    const lateCompleted = completed - onTimeCompleted;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    let score = completionRate;
    score -= (overdue / (total || 1)) * 30; // -30% penalty
    score += (onTimeCompleted / (completed || 1)) * 10; // +10% bonus
    const efficiencyScore = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round(score)));

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      department: member.department,
      createdAt: member.createdAt,
      completed,
      overdue,
      inProgress,
      pending: Math.max(0, pending),
      total,
      completionRate,
      onTimeCompleted,
      lateCompleted,
      efficiencyScore,
    };
  }, [member, memberTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const updateData: Partial<Task> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === 'Completed') {
      updateData.completedAt = new Date().toISOString();
    } else {
      updateData.completedAt = null;
    }

    await updateDocument(taskId, updateData);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteDocument(taskId);
  };

  if (teamLoading || tasksLoading || projectsLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (!member || !performance) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Team
        </button>
        <EmptyState
          icon={<User className="w-12 h-12" />}
          title="Teammate Not Found"
          description="The requested team member does not exist or has been deleted."
        />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Team Roster
      </button>

      <Header
        title={member.name}
        description={`${member.role} ${member.department ? `• ${member.department}` : ''}`}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          label="Total Tasks"
          value={performance.total}
          icon={<Briefcase className="h-6 w-6" />}
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <MetricCard
          label="Completed"
          value={performance.completed}
          icon={<CheckCircle2 className="h-6 w-6" />}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <MetricCard
          label="Active / Pending"
          value={performance.inProgress + performance.pending}
          icon={<Briefcase className="h-6 w-6" />}
          colorClass="text-blue-600 bg-blue-50"
        />
        <MetricCard
          label="Overdue"
          value={performance.overdue}
          icon={<AlertTriangle className="h-6 w-6" />}
          colorClass="text-rose-600 bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Chart */}
        <div className="lg:col-span-1">
          <PerformanceBarChart data={[performance]} />
        </div>

        {/* Right Column: Active Tasks List */}
        <div className="lg:col-span-2 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Current Workload</h2>
          {memberTasks.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No tasks currently assigned to {member.name}.
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 rounded-xl border border-slate-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {currentTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assigneeName={member.name}
                    projectName={projectMap[task.projectId]}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
              <div className="mt-auto pt-2">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  className="bg-transparent border-t-0 !px-0 !py-0 shadow-none rounded-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
