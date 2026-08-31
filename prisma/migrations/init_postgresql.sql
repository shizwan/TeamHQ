-- TeamHQ PostgreSQL Initial Migration
-- Compatible with PostgreSQL 13+, Neon, Supabase, Vercel Postgres

-- 1. Create Workspace table
CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default-workspace',
    "name" TEXT NOT NULL DEFAULT 'TeamHQ Workspace',
    "slug" TEXT NOT NULL UNIQUE DEFAULT 'teamhq',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "workspaceId" TEXT NOT NULL DEFAULT 'default-workspace',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "User_workspaceId_idx" ON "User"("workspaceId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- 3. Create TeamMember table
CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL DEFAULT 'default-workspace',
    "userId" TEXT DEFAULT 'admin-user',
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "manager" TEXT DEFAULT 'Shizwan',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TeamMember_workspaceId_idx" ON "TeamMember"("workspaceId");
CREATE INDEX IF NOT EXISTS "TeamMember_status_idx" ON "TeamMember"("status");

-- 4. Create Project table
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL DEFAULT 'default-workspace',
    "userId" TEXT NOT NULL DEFAULT 'admin-user',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'High',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "leadOwner" TEXT DEFAULT 'Shizwan',
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Project_workspaceId_idx" ON "Project"("workspaceId");
CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status");

-- 5. Create Task table
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliverableId" TEXT,
    "workspaceId" TEXT NOT NULL DEFAULT 'default-workspace',
    "userId" TEXT NOT NULL DEFAULT 'admin-user',
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'In Progress',
    "slipCause" TEXT DEFAULT 'N/A',
    "startDate" TIMESTAMP(3),
    "targetDueDate" TIMESTAMP(3),
    "targetDueTime" TEXT DEFAULT '10:00 PM',
    "completedDate" TIMESTAMP(3),
    "completedTime" TEXT,
    "daysActive" INTEGER NOT NULL DEFAULT 1,
    "delayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTimeStatus" TEXT NOT NULL DEFAULT 'Pending',
    "lifecycleStatus" TEXT NOT NULL DEFAULT '🟢 In Progress',
    "labels" TEXT DEFAULT '[]',
    "checklist" TEXT DEFAULT '[]',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Task_workspaceId_idx" ON "Task"("workspaceId");
CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "Task_targetDueDate_idx" ON "Task"("targetDueDate");
CREATE INDEX IF NOT EXISTS "Task_deliverableId_idx" ON "Task"("deliverableId");

-- 6. Create ActivityLog table
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL DEFAULT 'default-workspace',
    "userId" TEXT NOT NULL DEFAULT 'admin-user',
    "actorName" TEXT NOT NULL DEFAULT 'Shizwan',
    "actorEmail" TEXT DEFAULT 'shizwan@teamhq.io',
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityTitle" TEXT NOT NULL,
    "details" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ActivityLog_workspaceId_idx" ON "ActivityLog"("workspaceId");
CREATE INDEX IF NOT EXISTS "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
