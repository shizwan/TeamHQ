'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useAddDoc, useUpdateDoc, useDeleteDoc } from '@/hooks/useFirestore';
import { getTasksCollectionPath, getProjectsCollectionPath, getTeamCollectionPath } from '@/lib/firestorePaths';
import { useToast } from '@/contexts/ToastContext';
import { filterActiveTasks } from '@/lib/trackerEngine';
import type { Task, Project, TeamMember, TaskStatus } from '@/types';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TaskGrid from '@/components/tasks/TaskGrid';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import EditTaskModal from '@/components/tasks/EditTaskModal';
import TaskPreviewModal from '@/components/tasks/TaskPreviewModal';
import CompleteTaskModal, { CompletionData } from '@/components/tasks/CompleteTaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function TasksPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || '';

  const tasksPath = userId ? getTasksCollectionPath(userId) : null;
  const projectsPath = userId ? getProjectsCollectionPath(userId) : null;
  const teamPath = userId ? getTeamCollectionPath(userId) : null;

  const { data: tasks, loading: tasksLoading, refetch: refetchTasks, mutate: mutateTasks } = useCollection<Task>(tasksPath);
  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsPath);
  const { data: team, loading: teamLoading } = useCollection<TeamMember>(teamPath);

  const { addDocument, loading: addingTask } = useAddDoc(tasksPath);
  const { updateDocument, loading: updatingTask } = useUpdateDoc(tasksPath);
  const { deleteDocument, loading: deletingTask } = useDeleteDoc(tasksPath);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ task: Task; newStatus: TaskStatus } | null>(null);
  const [completeTaskTarget, setCompleteTaskTarget] = useState<Task | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'Archived'),
    [projects]
  );

  const activeTasks = useMemo(
    () => filterActiveTasks(tasks, projects),
    [tasks, projects]
  );

  const handleAddTask = useCallback(
    async (taskData: Partial<Task>) => {
      try {
        const id = await addDocument(taskData);
        if (id) {
          addToast('success', 'Task created', `"${taskData.title}" has been created.`);
          setIsAddModalOpen(false);
          await refetchTasks();
        }
      } catch {
        addToast('error', 'Failed to create task', 'Please try again later.');
      }
    },
    [addDocument, addToast, refetchTasks]
  );

  // Trigger Confirmation or Complete Pop-up on Status Change
  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target || target.status === newStatus) return;
      if (newStatus === 'Completed') {
        setCompleteTaskTarget(target);
      } else {
        setStatusChangeTarget({ task: target, newStatus });
      }
    },
    [tasks]
  );

  const handleConfirmCompleteTask = useCallback(
    async (taskId: string, completionData: CompletionData) => {
      setUpdatingStatus(true);
      const updateData: Partial<Task> = {
        status: 'Completed',
        completedDate: completionData.completedDate,
        completedTime: completionData.completedTime,
        completedAt: completionData.completedAt,
        slipCause: completionData.slipCause || 'N/A',
        updatedAt: new Date().toISOString(),
      };

      // Optimistic local update
      if (mutateTasks) {
        mutateTasks(
          (prev = []) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    ...updateData,
                    lifecycleStatus: '🟢 On-Time',
                  }
                : t
            ),
          false
        );
      }

      try {
        const success = await updateDocument(taskId, updateData);
        if (success) {
          addToast('success', 'Deliverable completed', 'Task marked as completed with recorded date and time.');
          await refetchTasks();
        }
      } catch {
        await refetchTasks();
        addToast('error', 'Failed to complete deliverable', 'Please try again.');
      } finally {
        setUpdatingStatus(false);
        setCompleteTaskTarget(null);
      }
    },
    [updateDocument, addToast, refetchTasks, mutateTasks]
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
      updateData.completedDate = null;
      updateData.completedTime = null;
    }

    // Optimistic local update
    if (mutateTasks) {
      mutateTasks(
        (prev = []) =>
          prev.map((t) => (t.id === task.id ? { ...t, ...updateData } : t)),
        false
      );
    }

    try {
      const success = await updateDocument(task.id, updateData);
      if (success) {
        addToast('success', 'Status updated', `"${task.title}" status changed to ${newStatus}.`);
        await refetchTasks();
      }
    } catch {
      await refetchTasks();
      addToast('error', 'Failed to update status', 'Please try again.');
    } finally {
      setUpdatingStatus(false);
      setStatusChangeTarget(null);
    }
  }, [statusChangeTarget, updateDocument, addToast, refetchTasks, mutateTasks]);

  const handleEditTask = useCallback(
    async (taskId: string, taskData: Partial<Task>) => {
      const success = await updateDocument(taskId, taskData);
      if (success) {
        addToast('success', 'Task updated', `"${taskData.title || 'Task'}" has been updated.`);
        setEditingTask(null);
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

  const isInitialLoading = (teamLoading && team.length === 0) || (projectsLoading && projects.length === 0) || (tasksLoading && tasks.length === 0);

  if (isInitialLoading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Header
          title="All Deliverables"
          description={`Viewing all active deliverables (${activeTasks.length} total)`}
        />
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Deliverable
        </button>
      </div>

      {activeProjects.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
          <p className="font-semibold text-sm">No active projects available</p>
          <p className="text-xs text-amber-600 mt-1">
            You need at least one active project before creating deliverables. Head over to the Projects tab to create one.
          </p>
        </div>
      ) : (
        <TaskGrid
          tasks={activeTasks}
          projects={activeProjects}
          team={team}
          onStatusChange={handleStatusChange}
          onEdit={(task) => setEditingTask(task)}
          onDelete={handleRequestDelete}
          onPreview={(task) => setPreviewTask(task)}
        />
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projects={activeProjects}
        team={team}
        onSubmit={handleAddTask}
        loading={addingTask}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        projects={activeProjects}
        team={team}
        onSubmit={handleEditTask}
        loading={updatingTask}
      />

      {/* Task Preview Modal */}
      <TaskPreviewModal
        isOpen={!!previewTask}
        onClose={() => setPreviewTask(null)}
        task={previewTask}
        projects={activeProjects}
        team={team}
        onEdit={(task) => setEditingTask(task)}
        onDelete={handleRequestDelete}
        onStatusChange={handleStatusChange}
      />

      {/* Complete Deliverable Modal with Date/Time Picker */}
      <CompleteTaskModal
        isOpen={!!completeTaskTarget}
        onClose={() => setCompleteTaskTarget(null)}
        task={completeTaskTarget}
        onConfirm={handleConfirmCompleteTask}
        loading={updatingStatus}
      />

      {/* Status Change Confirmation Pop-up (for other statuses) */}
      <ConfirmDialog
        open={!!statusChangeTarget}
        title="Change Deliverable Status?"
        description={`Are you sure you want to change the status of "${statusChangeTarget?.task.title}" from "${statusChangeTarget?.task.status}" to "${statusChangeTarget?.newStatus}"?`}
        confirmLabel={`Change to ${statusChangeTarget?.newStatus || 'Status'}`}
        cancelLabel="Cancel"
        variant={statusChangeTarget?.newStatus === 'Blocked' ? 'danger' : 'info'}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusChangeTarget(null)}
        loading={updatingStatus}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Deliverable?"
        description={`"${deleteTarget?.title}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Deliverable"
        variant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingTask}
      />
    </>
  );
}
