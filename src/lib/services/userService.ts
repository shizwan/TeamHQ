import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import type { z } from 'zod';
import type { CreateUserSchema, UpdateUserSchema } from '@/lib/validation/schemas';

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return await prisma.user.findUnique({
    where: { email: normalized },
  });
}

export async function authenticateUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (!user || !user.active) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceId: user.workspaceId,
  };
}

export async function createUser(data: z.infer<typeof CreateUserSchema>, workspaceId = 'default-workspace') {
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
      name: data.name,
      role: data.role || 'MEMBER',
      workspaceId,
      active: true,
    },
  });

  return {
    id: created.id,
    email: created.email,
    name: created.name,
    role: created.role,
    workspaceId: created.workspaceId,
    createdAt: created.createdAt,
  };
}

export async function listUsers(workspaceId = 'default-workspace') {
  const users = await prisma.user.findMany({
    where: { workspaceId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return users;
}
