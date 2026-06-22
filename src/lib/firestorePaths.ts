/**
 * Centralized Firestore collection path builder.
 * Keeps all path logic in one place to avoid duplication and typos.
 */

const APP_ROOT = 'cynohq';

export function getTeamCollectionPath(userId: string): string {
  return `${APP_ROOT}/users/${userId}/team`;
}

export function getTeamDocPath(userId: string, memberId: string): string {
  return `${APP_ROOT}/users/${userId}/team/${memberId}`;
}

export function getTasksCollectionPath(userId: string): string {
  return `${APP_ROOT}/users/${userId}/tasks`;
}

export function getTaskDocPath(userId: string, taskId: string): string {
  return `${APP_ROOT}/users/${userId}/tasks/${taskId}`;
}

export function getProjectsCollectionPath(userId: string): string {
  return `${APP_ROOT}/users/${userId}/projects`;
}
