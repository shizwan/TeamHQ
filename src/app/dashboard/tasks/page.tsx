'use client';

import React, { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useAddDoc, useUpdateDoc, useDeleteDoc } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { useToast } from '@/contexts/ToastContext';
import { sanitizeString } from '@/lib/validation';
import type { TeamMember, Task, Project, TaskStatus, NewTaskForm } from '@/types';
import Header from '@/components/layout/Header';
import TaskGrid from '@/components/tasks/TaskGrid';
import AddTaskForm from '@/components/tasks/AddTaskForm';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function TasksPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || '';

  const teamPath = userId ? getTeamCollectionPath(userId) : null;
  const projectsPath = userId ? getProjectsCollectionPath(userId) : null;
  const tasksPath = userId ? getTasksCollectionPath(userId) : null;

  const { data: team, loading: teamLoading } = useCollection<TeamMember>(teamPath);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsPath);
  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useCollection<Task>(tasksPath);
  
  const { addDocument: addTask, loading: addingTask } = useAddDoc(tasksPath);
  const { updateDocument } = useUpdateDoc(tasksPath);
  const { deleteDocument, loading: deletingTask } = useDeleteDoc(tasksPath);

  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [editTaskTarget, setEditTaskTarget] = React.useState<Task | null>(null);

  // Derive an active projects list since we can only assign tasks to active projects
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'Active'), [projects]);

  const handleAddTask = useCallback(
    async (data: NewTaskForm) => {
      const now = new Date().toISOString();
      const result = await addTask({
        userId,
        projectId: data.projectId,
        title: sanitizeString(data.title),
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        status: data.status,
        createdAt: now,
        updatedAt: now,
      });

      if (result) {
        addToast('success', 'Task assigned', `"${data.title}" has been created.`);
        refetchTasks();
      } else {
        addToast('error', 'Failed to create task', 'Please try again.');
      }
    },
    [addTask, addToast]
  );

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
        refetchTasks();
      } else {
        addToast('error', 'Failed to update status', 'Please try again.');
      }
    },
    [updateDocument, addToast, refetchTasks]
  );

  const handleEditTask = useCallback(
    async (taskId: string, data: Partial<Task>) => {
      const success = await updateDocument(taskId, data);
      if (success) {
        addToast('success', 'Task updated', 'The task has been modified.');
        setEditTaskTarget(null);
        refetchTasks();
      } else {
        addToast('error', 'Failed to update task', 'Please try again later.');
      }
    },
    [updateDocument, addToast, refetchTasks]
  );

  const handleDeleteTask = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      const success = await deleteDocument(deleteTarget.id);
      if (success) {
        addToast('success', 'Task deleted', `"${deleteTarget.title}" has been removed.`);
        refetchTasks();
      }
    } catch (error) {
      addToast('error', 'Failed to delete task', 'Please try again.');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteDocument, addToast]);

  const handleRequestDelete = useCallback((id: string, title: string) => {
    setDeleteTarget({ id, title });
  }, []);

  if (teamLoading || projectsLoading || tasksLoading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  return (
    <>
      <Header
        title="Task Execution Board"
        description="Global view of all tasks across all projects."
      />

      <div className="mb-6">
        {activeProjects.length > 0 ? (
          <AddTaskForm 
            projects={activeProjects} 
            team={team} 
            onSubmit={handleAddTask} 
            loading={addingTask} 
          />
        ) : (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 text-sm">
            You must create an Active project before you can assign tasks. Head over to the Projects tab to get started.
          </div>
        )}
      </div>

      <TaskGrid
        tasks={tasks}
        projects={projects}
        team={team}
        onStatusChange={handleStatusChange}
        onEdit={setEditTaskTarget}
        onDelete={handleRequestDelete}
      />

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

      <EditTaskModal
        isOpen={!!editTaskTarget}
        onClose={() => setEditTaskTarget(null)}
        task={editTaskTarget}
        projects={projects}
        team={team}
        onSubmit={handleEditTask}
        loading={false}
      />
    </>
  );
}
