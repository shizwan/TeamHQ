'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useUpdateDoc, useDeleteDoc } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { useToast } from '@/contexts/ToastContext';
import type { TeamMember, Task, TaskStatus, Project } from '@/types';
import Header from '@/components/layout/Header';
import TaskCard from '@/components/tasks/TaskCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Calendar, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

type TabType = 'overdue' | 'today' | 'week' | 'upcoming';

export default function DeadlinesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || '';

  const teamPath = userId ? getTeamCollectionPath(userId) : null;
  const tasksPath = userId ? getTasksCollectionPath(userId) : null;
  const projectsPath = userId ? getProjectsCollectionPath(userId) : null;

  const { data: team, loading: teamLoading } = useCollection<TeamMember>(teamPath);
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksPath);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsPath);
  
  const { updateDocument } = useUpdateDoc(tasksPath);
  const { deleteDocument, loading: deletingTask } = useDeleteDoc(tasksPath);

  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [nowTime, setNowTime] = useState(() => Date.now());
  const [activeTab, setActiveTab] = React.useState<'overdue' | 'today' | 'week' | 'upcoming'>('overdue');

  useEffect(() => {
    const interval = setInterval(() => setNowTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const teamMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of team) {
      map[member.id] = member.name;
    }
    return map;
  }, [team]);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of projects) {
      map[project.id] = project.title;
    }
    return map;
  }, [projects]);

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const updateData: Partial<Task> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      
      if (newStatus === 'Completed') {
        updateData.completedAt = new Date().toISOString();
      } else {
        updateData.completedAt = null;
      }

      const success = await updateDocument(taskId, updateData);

      if (success) {
        addToast('info', 'Status updated', `Task marked as "${newStatus}".`);
      } else {
        addToast('error', 'Failed to update status', 'Please try again.');
      }
    },
    [updateDocument, addToast]
  );

  const handleDeleteTask = useCallback(async () => {
    if (!deleteTarget) return;

    const success = await deleteDocument(deleteTarget.id);
    if (success) {
      addToast('success', 'Task deleted', `"${deleteTarget.title}" has been removed.`);
    } else {
      addToast('error', 'Failed to delete task', 'Please try again.');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteDocument, addToast]);

  const handleRequestDelete = useCallback((id: string, title: string) => {
    setDeleteTarget({ id, title });
  }, []);

  const { todayEnd, weekEnd } = useMemo(() => {
    const tEnd = new Date(nowTime);
    tEnd.setHours(23, 59, 59, 999);
    
    const wEnd = new Date(nowTime);
    wEnd.setDate(wEnd.getDate() + 7);
    wEnd.setHours(23, 59, 59, 999);
    
    return { todayEnd: tEnd, weekEnd: wEnd };
  }, [nowTime]);

  const groupedTasks = useMemo(() => {
    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const dueThisWeek: Task[] = [];
    const upcoming: Task[] = [];

    const todayTime = todayEnd.getTime();
    const weekTime = weekEnd.getTime();

    const activeTasks = tasks.filter(t => t.status !== 'Completed').sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    activeTasks.forEach((task) => {
      const taskTime = new Date(task.dueDate).getTime();
      
      if (task.status === 'Overdue' || taskTime < nowTime) {
        overdue.push(task);
      } else if (taskTime <= todayTime) {
        dueToday.push(task);
      } else if (taskTime <= weekTime) {
        dueThisWeek.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return { overdue, dueToday, dueThisWeek, upcoming };
  }, [tasks, nowTime, todayEnd, weekEnd]);

  const tasksForActiveTab = useMemo(() => {
    switch (activeTab) {
      case 'overdue': return groupedTasks.overdue;
      case 'today': return groupedTasks.dueToday;
      case 'week': return groupedTasks.dueThisWeek;
      case 'upcoming': return groupedTasks.upcoming;
      default: return [];
    }
  }, [activeTab, groupedTasks]);

  const { currentItems, currentPage, totalPages, goToPage } = usePagination(tasksForActiveTab, 9);

  // Reset to page 1 when active tab changes
  useEffect(() => {
    goToPage(1);
  }, [activeTab, goToPage]);

  if (teamLoading || tasksLoading || projectsLoading) {
    return <LoadingSpinner message="Loading deadlines..." />;
  }

  const renderGroup = (
    title: string, 
    originalArray: Task[], 
    paginatedArray: Task[],
    icon: React.ReactNode, 
    emptyMessage: string
  ) => {
    if (originalArray.length === 0) {
      return (
        <div className="mb-10">
          <div className="p-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className={`p-4 rounded-full bg-slate-100 mb-4`}>
              {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">All clear</h3>
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-10 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedArray.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assigneeName={teamMap[task.assigneeId] ?? 'Unknown'}
              projectName={projectMap[task.projectId]}
              onStatusChange={handleStatusChange}
              onDelete={handleRequestDelete}
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
    );
  };

  const tabs = [
    { id: 'overdue', label: 'Overdue', count: groupedTasks.overdue.length, icon: AlertCircle, color: 'text-rose-500' },
    { id: 'today', label: 'Due Today', count: groupedTasks.dueToday.length, icon: Clock, color: 'text-amber-500' },
    { id: 'week', label: 'Due Next 7 Days', count: groupedTasks.dueThisWeek.length, icon: CalendarDays, color: 'text-blue-500' },
    { id: 'upcoming', label: 'Upcoming', count: groupedTasks.upcoming.length, icon: Calendar, color: 'text-indigo-500' },
  ];

  return (
    <>
      <Header
        title="Deadlines"
        description="Chronological view of active tasks prioritized by due date."
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-xl mb-8 w-fit border border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : 'opacity-70'}`} />
              {tab.label}
              <span className={`ml-1.5 py-0.5 px-2 rounded-full text-xs font-semibold ${
                isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/50 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'overdue' && renderGroup(
        'Overdue', 
        groupedTasks.overdue, 
        currentItems,
        <AlertCircle className="w-8 h-8 text-rose-500" />, 
        'Great job! No overdue tasks to worry about.'
      )}

      {activeTab === 'today' && renderGroup(
        'Due Today', 
        groupedTasks.dueToday, 
        currentItems,
        <Clock className="w-8 h-8 text-amber-500" />, 
        'Nothing due today. Enjoy your day!'
      )}

      {activeTab === 'week' && renderGroup(
        'Due Next 7 Days', 
        groupedTasks.dueThisWeek, 
        currentItems,
        <CalendarDays className="w-8 h-8 text-blue-500" />, 
        'No tasks due in the next week.'
      )}

      {activeTab === 'upcoming' && renderGroup(
        'Upcoming', 
        groupedTasks.upcoming, 
        currentItems,
        <Calendar className="w-8 h-8 text-indigo-500" />, 
        'No upcoming tasks scheduled yet.'
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this task?"
        description={`"${deleteTarget?.title}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete Task"
        variant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingTask}
      />
    </>
  );
}
