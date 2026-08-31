'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useAddDoc, useUpdateDoc, useDeleteDoc } from '@/hooks/useFirestore';
import { getTasksCollectionPath, getProjectsCollectionPath, getTeamCollectionPath } from '@/lib/firestorePaths';
import { useToast } from '@/contexts/ToastContext';
import { filterActiveTasks } from '@/lib/trackerEngine';
import type { Task, Project, TeamMember, TaskStatus } from '@/types';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TaskBoard from '@/components/tasks/board/TaskBoard';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function BoardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || '';

  const tasksPath = userId ? getTasksCollectionPath(userId) : null;
  const projectsPath = userId ? getProjectsCollectionPath(userId) : null;
  const teamPath = userId ? getTeamCollectionPath(userId) : null;

  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useCollection<Task>(tasksPath);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsPath);
  const { data: team, loading: teamLoading } = useCollection<TeamMember>(teamPath);

  const { addDocument: addTask, loading: addingTask } = useAddDoc(tasksPath);
  const { updateDocument, loading: updatingTask } = useUpdateDoc(tasksPath);
  const { deleteDocument, loading: deletingTask } = useDeleteDoc(tasksPath);

  const [editTaskTarget, setEditTaskTarget] = useState<Task | null>(null);
  const [addTaskTargetStatus, setAddTaskTargetStatus] = useState<TaskStatus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ task: Task; newStatus: TaskStatus } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filter out archived projects & tasks of archived projects
  const activeProjects = useMemo(() => projects.filter((p) => p.status !== 'Archived'), [projects]);
  const activeTasks = useMemo(() => filterActiveTasks(tasks, projects), [tasks, projects]);

  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target || target.status === newStatus) return;
      setStatusChangeTarget({ task: target, newStatus });
    },
    [tasks]
  );

  const handleConfirmStatusChange = useCallback(async () => {
    if (!statusChangeTarget) return;
    const { task, newStatus } = statusChangeTarget;
    setUpdatingStatus(true);

    const updateData: Partial<Task> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === 'Completed') {
      updateData.completedAt = new Date().toISOString();
    } else {
      updateData.completedAt = null;
    }

    try {
      const success = await updateDocument(task.id, updateData);
      if (success) {
        addToast('success', 'Status updated', `"${task.title}" status changed to ${newStatus}.`);
        refetchTasks();
      }
    } catch {
      addToast('error', 'Failed to update status', 'Please try again.');
    } finally {
      setUpdatingStatus(false);
      setStatusChangeTarget(null);
    }
  }, [statusChangeTarget, updateDocument, addToast, refetchTasks]);

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

  // Quick complete: triggers confirmation popup
  const handleQuickComplete = useCallback(
    (taskId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target || target.status === 'Completed') return;
      setStatusChangeTarget({ task: target, newStatus: 'Completed' });
    },
    [tasks]
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
    } catch {
      addToast('error', 'Failed to delete task', 'Please try again.');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteDocument, addToast, refetchTasks]);

  const handleRequestDelete = useCallback((id: string, title: string) => {
    setDeleteTarget({ id, title });
  }, []);

  if (teamLoading || projectsLoading || tasksLoading) {
    return <LoadingSpinner message="Loading task board..." />;
  }

  return (
    <>
      <Header
        title="Task Board"
        description="Drag and drop tasks between workflow stages to update their status"
      />

      <TaskBoard
        tasks={activeTasks}
        team={team}
        projects={activeProjects}
        onStatusChange={handleStatusChange}
        onEdit={(task) => setEditTaskTarget(task)}
        onDelete={handleRequestDelete}
        onQuickComplete={handleQuickComplete}
        onQuickAdd={handleQuickAdd}
      />

      {/* Status Change Confirmation Pop-up */}
      <ConfirmDialog
        open={!!statusChangeTarget}
        title="Change Deliverable Status?"
        description={
          statusChangeTarget?.newStatus === 'Completed'
            ? `Mark "${statusChangeTarget?.task.title}" as Completed? This will record the completion timestamp and compute SLA metrics.`
            : `Are you sure you want to change the status of "${statusChangeTarget?.task.title}" from "${statusChangeTarget?.task.status}" to "${statusChangeTarget?.newStatus}"?`
        }
        confirmLabel={`Change to ${statusChangeTarget?.newStatus || 'Status'}`}
        cancelLabel="Cancel"
        variant={statusChangeTarget?.newStatus === 'Completed' ? 'success' : statusChangeTarget?.newStatus === 'Blocked' ? 'danger' : 'info'}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusChangeTarget(null)}
        loading={updatingStatus}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={!!editTaskTarget}
        onClose={() => setEditTaskTarget(null)}
        task={editTaskTarget}
        projects={activeProjects}
        team={team}
        onSubmit={handleEditTask}
        loading={updatingTask}
      />

      {/* Quick Add Task Modal */}
      <AddTaskModal
        isOpen={!!addTaskTargetStatus}
        onClose={() => setAddTaskTargetStatus(null)}
        projects={activeProjects}
        team={team}
        defaultStatus={addTaskTargetStatus || 'In Progress'}
        onSubmit={handleCreateTask}
        loading={addingTask}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Task?"
        description={`"${deleteTarget?.title}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Task"
        variant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingTask}
      />
    </>
  );
}
