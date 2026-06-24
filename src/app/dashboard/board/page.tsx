'use client';

import React, { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useAddDoc, useUpdateDoc, useDeleteDoc } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { useToast } from '@/contexts/ToastContext';
import { sanitizeString } from '@/lib/validation';
import type { TeamMember, Task, Project, TaskStatus } from '@/types';
import Header from '@/components/layout/Header';
import TaskBoard from '@/components/tasks/board/TaskBoard';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function BoardPage() {
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
  const [addTaskTargetStatus, setAddTaskTargetStatus] = React.useState<TaskStatus | null>(null);

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
        addToast('info', 'Status updated', `Task moved to "${newStatus}".`);
        refetchTasks();
      } else {
        addToast('error', 'Failed to update status', 'Please try again.');
      }
    },
    [updateDocument, addToast, refetchTasks]
  );

  const handleQuickAdd = useCallback((status: TaskStatus) => {
    setAddTaskTargetStatus(status);
  }, []);

  const handleCreateTask = useCallback(
    async (data: any) => {
      const now = new Date().toISOString();

      const result = await addTask({
        userId,
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      if (result) {
        addToast('success', 'Task added', `New task created successfully.`);
        refetchTasks();
        setAddTaskTargetStatus(null);
      } else {
        addToast('error', 'Failed to add task', 'Please try again.');
      }
    },
    [addTask, addToast, refetchTasks, userId]
  );

  // Quick complete: instantly marks a task as Completed
  const handleQuickComplete = useCallback(
    async (taskId: string) => {
      const now = new Date().toISOString();
      const success = await updateDocument(taskId, {
        status: 'Completed' as TaskStatus,
        completedAt: now,
        updatedAt: now,
      });

      if (success) {
        addToast('success', 'Task completed', 'Task marked as completed.');
        refetchTasks();
      } else {
        addToast('error', 'Failed to complete task', 'Please try again.');
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
  }, [deleteTarget, deleteDocument, addToast, refetchTasks]);

  const handleRequestDelete = useCallback((id: string, title: string) => {
    setDeleteTarget({ id, title });
  }, []);

  if (teamLoading || projectsLoading || tasksLoading) {
    return <LoadingSpinner message="Loading board..." />;
  }

  return (
    <>
      <Header
        title="Kanban Board"
        description="Drag and drop tasks between columns to update their status."
      />

      <TaskBoard
        tasks={tasks}
        projects={projects}
        team={team}
        onStatusChange={handleStatusChange}
        onEdit={setEditTaskTarget}
        onDelete={handleRequestDelete}
        onQuickAdd={handleQuickAdd}
        onQuickComplete={handleQuickComplete}
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

      <AddTaskModal
        isOpen={!!addTaskTargetStatus}
        onClose={() => setAddTaskTargetStatus(null)}
        defaultStatus={addTaskTargetStatus}
        projects={projects}
        team={team}
        onSubmit={handleCreateTask}
        loading={addingTask}
      />
    </>
  );
}
