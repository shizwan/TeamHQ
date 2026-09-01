import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { getEnv, isProduction } from '@/lib/env';
import type { z } from 'zod';
import type { CreateUserSchema, UpdateUserSchema } from '@/lib/validation/schemas';
import type { UserRole } from '@/lib/security';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  workspaceId: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Safely parses and narrows a database role string into the strict UserRole union.
 */
function parseUserRole(role: string): UserRole {
  switch (role) {
    case 'ADMIN':
    case 'MANAGER':
    case 'MEMBER':
    case 'VIEWER':
      return role;
    default:
      return 'MEMBER';
  }
}

/**
 * Maps a raw Prisma user selection to a safe, strongly-typed UserSummary object.
 */
function toUserSummary(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  workspaceId: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UserSummary {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: parseUserRole(user.role),
    active: user.active,
    workspaceId: user.workspaceId,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Finds a user by email address (case-insensitive)
 */
export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return await prisma.user.findUnique({
    where: { email: normalized },
  });
}

/**
 * Finds a user by ID
 */
export async function findUserById(id: string): Promise<UserSummary | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      workspaceId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user ? toUserSummary(user) : null;
}

/**
 * Alias for findUserById for backward compatibility
 */
export const getUserById = findUserById;

/**
 * Authenticates a user with email and password.
 * Includes automatic database bootstrap for fresh deployments.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const normalized = email.trim().toLowerCase();
  const env = getEnv();
  const configuredAdminEmail = (env.ADMIN_EMAIL || 'admin@teamhq.com').trim().toLowerCase();
  const configuredAdminPassword = env.ADMIN_PASSWORD || (isProduction() ? undefined : 'admin123');

  let user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  // Auto-bootstrap default administrator account if database has 0 users
  if (!user && (normalized === configuredAdminEmail || normalized === 'admin@teamhq.com')) {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      if (!configuredAdminPassword) {
        throw new Error(
          '[CRITICAL SECURITY ERROR] Cannot auto-bootstrap administrator in production without ADMIN_PASSWORD environment variable set.'
        );
      }

      // Ensure default workspace exists
      await prisma.workspace.upsert({
        where: { id: 'default-workspace' },
        update: {},
        create: { id: 'default-workspace', name: 'TeamHQ Workspace', slug: 'teamhq' },
      });

      const passwordHash = await hashPassword(configuredAdminPassword);
      user = await prisma.user.create({
        data: {
          email: normalized,
          passwordHash,
          name: 'Shizwan',
          role: 'ADMIN',
          workspaceId: 'default-workspace',
          active: true,
        },
      });
    }
  }

  if (!user || !user.active) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // Update last login timestamp safely
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  } catch (err: unknown) {
    console.warn('[AUTH WARNING] Failed to record lastLoginAt timestamp:', err);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: parseUserRole(user.role),
    workspaceId: user.workspaceId,
  };
}

/**
 * Creates a new user with hashed password
 */
export async function createUser(
  data: z.infer<typeof CreateUserSchema>,
  workspaceId = 'default-workspace'
): Promise<UserSummary> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new Error('A user with this email address already exists');
  }

  const passwordHash = await hashPassword(data.password);

  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: data.name.trim(),
      role: data.role || 'MEMBER',
      workspaceId,
      active: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      workspaceId: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return toUserSummary(created);
}

/**
 * Updates an existing user's details or credentials
 */
export async function updateUser(
  userId: string,
  data: z.infer<typeof UpdateUserSchema>
): Promise<UserSummary> {
  const updatePayload: Prisma.UserUpdateInput = {};

  if (data.name !== undefined) {
    updatePayload.name = data.name.trim();
  }
  if (data.role !== undefined) {
    updatePayload.role = data.role;
  }
  if (data.active !== undefined) {
    updatePayload.active = data.active;
  }
  if (data.password) {
    updatePayload.passwordHash = await hashPassword(data.password);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updatePayload,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      workspaceId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return toUserSummary(updated);
}

/**
 * Changes a user's password after verifying the old password
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const isValid = await verifyPassword(oldPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return true;
}

/**
 * Deactivates a user account (soft delete)
 */
export async function deactivateUser(userId: string): Promise<UserSummary> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { active: false },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      workspaceId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return toUserSummary(updated);
}

/**
 * Permanently deletes a user account
 */
export async function deleteUser(userId: string): Promise<UserSummary> {
  const deleted = await prisma.user.delete({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      workspaceId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return toUserSummary(deleted);
}

/**
 * Lists all users in a workspace
 */
export async function listUsers(workspaceId = 'default-workspace'): Promise<UserSummary[]> {
  const users = await prisma.user.findMany({
    where: { workspaceId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      workspaceId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map(toUserSummary);
}

/**
 * Counts total users in a workspace
 */
export async function countUsers(workspaceId = 'default-workspace'): Promise<number> {
  return await prisma.user.count({
    where: { workspaceId },
  });
}
