import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from '../src/lib/auth';
import { hasPermission, isRoleAtLeast } from '../src/lib/security';
import {
  generateDeliverableId,
  generateNextDeliverableId,
  calculateDelayHours,
  calculateOnTimeStatus,
  calculateLifecycleStatus,
  calculateTeamPerformance,
  calculateProjectPerformance,
  calculateGlobalTaskMetrics,
  enrichTaskMetrics,
} from '../src/lib/trackerEngine';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  CreateProjectSchema,
  CreateMemberSchema,
  LoginSchema,
} from '../src/lib/validation/schemas';
import { prisma } from '../src/lib/prisma';
import type { Task, TeamMember, Project } from '../src/types';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✔ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${details ? ` (${details})` : ''}`);
    failedTests++;
  }
}

async function runAuthTests() {
  console.log('\n--- 1. Authentication & Cryptography Tests ---');

  const password = 'TestSecurePassword123!';
  const hash = await hashPassword(password);

  assert(hash.startsWith('$2'), 'Password hashed with bcrypt');
  assert(hash !== password, 'Password hash is not plaintext');

  const isValid = await verifyPassword(password, hash);
  assert(isValid === true, 'Valid password verification succeeds');

  const isInvalid = await verifyPassword('WrongPassword123!', hash);
  assert(isInvalid === false, 'Invalid password verification fails');

  const sessionUser = {
    uid: 'test-user-1',
    email: 'admin@teamhq.com',
    displayName: 'Test Admin',
    role: 'ADMIN',
    workspaceId: 'default-workspace',
  };

  const token = await signSessionToken(sessionUser);
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT session token generated with 3 segments');

  const decoded = await verifySessionToken(token);
  assert(decoded !== null && decoded.uid === sessionUser.uid, 'JWT session token verified correctly');
  assert(decoded?.email === 'admin@teamhq.com', 'JWT decoded email matches');
  assert(decoded?.role === 'ADMIN', 'JWT decoded role matches');

  const tamperedToken = token.slice(0, -5) + 'xxxxx';
  const decodedTampered = await verifySessionToken(tamperedToken);
  assert(decodedTampered === null, 'Tampered JWT token is rejected');
}

async function runRbacTests() {
  console.log('\n--- 2. RBAC & Authorization Permission Matrix Tests ---');

  // ADMIN permissions
  assert(hasPermission('ADMIN', 'system:admin'), 'ADMIN has system:admin permission');
  assert(hasPermission('ADMIN', 'user:manage'), 'ADMIN has user:manage permission');
  assert(hasPermission('ADMIN', 'activity:clear'), 'ADMIN has activity:clear permission');
  assert(hasPermission('ADMIN', 'task:create'), 'ADMIN has task:create permission');
  assert(hasPermission('ADMIN', 'project:delete'), 'ADMIN has project:delete permission');

  // MANAGER permissions
  assert(hasPermission('MANAGER', 'task:create'), 'MANAGER has task:create permission');
  assert(hasPermission('MANAGER', 'project:create'), 'MANAGER has project:create permission');
  assert(hasPermission('MANAGER', 'team:manage'), 'MANAGER has team:manage permission');
  assert(!hasPermission('MANAGER', 'user:manage'), 'MANAGER does NOT have user:manage permission');
  assert(!hasPermission('MANAGER', 'activity:clear'), 'MANAGER does NOT have activity:clear permission');

  // MEMBER permissions
  assert(hasPermission('MEMBER', 'task:create'), 'MEMBER has task:create permission');
  assert(hasPermission('MEMBER', 'task:edit'), 'MEMBER has task:edit permission');
  assert(!hasPermission('MEMBER', 'team:manage'), 'MEMBER does NOT have team:manage permission');
  assert(!hasPermission('MEMBER', 'project:delete'), 'MEMBER does NOT have project:delete permission');

  // VIEWER permissions
  assert(hasPermission('VIEWER', 'reports:view'), 'VIEWER has reports:view permission');
  assert(!hasPermission('VIEWER', 'task:create'), 'VIEWER does NOT have task:create permission');
  assert(!hasPermission('VIEWER', 'task:edit'), 'VIEWER does NOT have task:edit permission');

  // Role hierarchy
  assert(isRoleAtLeast('ADMIN', 'MANAGER'), 'ADMIN is at least MANAGER');
  assert(isRoleAtLeast('MANAGER', 'MEMBER'), 'MANAGER is at least MEMBER');
  assert(!isRoleAtLeast('MEMBER', 'MANAGER'), 'MEMBER is not at least MANAGER');
}

async function runEngineTests() {
  console.log('\n--- 3. Tracker Engine & Business Rules Tests ---');

  // Deliverable ID Generation
  assert(generateDeliverableId(1) === 'DLV-000001', 'generateDeliverableId(1) returns DLV-000001');
  assert(generateDeliverableId(45) === 'DLV-000045', 'generateDeliverableId(45) returns DLV-000045');
  assert(generateNextDeliverableId(['DLV-000001', 'DLV-000005', 'DLV-000002']) === 'DLV-000006', 'generateNextDeliverableId increments highest existing ID');

  // Delay calculation for completed tasks
  const onTimeDelay = calculateDelayHours('2026-08-25', '10:00 PM', '2026-08-25', '09:00 PM', 'Completed');
  assert(onTimeDelay === 0, 'Completed before ETA has 0 delay hours');

  const lateDelay = calculateDelayHours('2026-08-25', '07:00 PM', '2026-08-25', '10:00 PM', 'Completed');
  assert(lateDelay === 3, 'Completed 3 hours past ETA has 3 delay hours');

  // Live Overdue calculation for active tasks
  const pastDue = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const liveOverdueDelay = calculateDelayHours(pastDue, '10:00 PM', null, null, 'In Progress');
  assert(liveOverdueDelay > 0, 'Active task with past due date dynamically computes delay hours > 0');

  const futureDue = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const liveFutureDelay = calculateDelayHours(futureDue, '10:00 PM', null, null, 'In Progress');
  assert(liveFutureDelay === 0, 'Active task with future due date has 0 delay hours');

  // On-time status
  assert(calculateOnTimeStatus('Completed', '2026-08-25', '10:00 PM', '2026-08-25', '10:00 PM') === 'Yes', 'Completed on time is "Yes"');
  assert(calculateOnTimeStatus('Completed', '2026-08-25', '07:00 PM', '2026-08-25', '10:00 PM') === 'No', 'Completed late is "No"');
  assert(calculateOnTimeStatus('Cancelled', '2026-08-25', '10:00 PM') === 'Unverified', 'Cancelled task on-time status is "Unverified"');

  // Lifecycle Status
  assert(calculateLifecycleStatus('Completed', 'Yes', 'N/A', 0) === '🟢 On-Time', 'On-time completed task lifecycle is 🟢 On-Time');
  assert(calculateLifecycleStatus('Completed', 'No', 'Developer', 3) === '🔴 Delayed', 'Delayed completed task lifecycle is 🔴 Delayed');
  assert(calculateLifecycleStatus('Carried Forward', 'Pending', 'Developer', 0) === '🔴 Carried Fwd', 'Carried forward lifecycle is 🔴 Carried Fwd');
  assert(calculateLifecycleStatus('In Progress', 'No', 'Developer', 5) === '🔴 Overdue', 'Overdue in-progress task lifecycle is 🔴 Overdue');

  // Team Performance Matrix Calculations
  const mockMembers: TeamMember[] = [
    { id: 'm1', name: 'Alice', role: 'Dev', createdAt: new Date().toISOString() },
    { id: 'm2', name: 'Bob', role: 'Dev', createdAt: new Date().toISOString() },
    { id: 'm3', name: 'Charlie (New)', role: 'Dev', createdAt: new Date().toISOString() },
  ];

  const mockTasks: Task[] = [
    // Alice: 3 completed (all on-time), 0 slips -> Top Performer
    { id: 't1', projectId: 'p1', assigneeId: 'm1', title: 'T1', status: 'Completed', onTimeStatus: 'Yes', delayHours: 0, slipCause: 'N/A', createdAt: '', updatedAt: '' },
    { id: 't2', projectId: 'p1', assigneeId: 'm1', title: 'T2', status: 'Completed', onTimeStatus: 'Yes', delayHours: 0, slipCause: 'N/A', createdAt: '', updatedAt: '' },
    { id: 't3', projectId: 'p1', assigneeId: 'm1', title: 'T3', status: 'Completed', onTimeStatus: 'Yes', delayHours: 0, slipCause: 'N/A', createdAt: '', updatedAt: '' },
    // Bob: 1 completed (delayed), 1 slip -> Action Required
    { id: 't4', projectId: 'p1', assigneeId: 'm2', title: 'T4', status: 'Completed', onTimeStatus: 'No', delayHours: 5, slipCause: 'Developer', createdAt: '', updatedAt: '' },
    // Charlie: 0 tasks -> Standby
  ];

  const perf = calculateTeamPerformance(mockMembers, mockTasks);
  assert(perf[0].name === 'Alice' && perf[0].performanceRating === '🟢 Top Performer', 'Alice is evaluated as 🟢 Top Performer');
  assert(perf[1].name === 'Bob' && perf[1].performanceRating === '🔴 Action Required', 'Bob with slips is evaluated as 🔴 Action Required');
  assert(perf[2].name === 'Charlie (New)' && perf[2].performanceRating === '⚪ Standby', 'Charlie with 0 tasks is evaluated as ⚪ Standby');
}

async function runValidationTests() {
  console.log('\n--- 4. API Validation Schemas & Mass Assignment Protection Tests ---');

  // Valid Task Schema
  const validTask = CreateTaskSchema.safeParse({
    projectId: 'p-1',
    assigneeId: 'm-1',
    title: 'Valid Task Title',
    status: 'In Progress',
    slipCause: 'Developer',
  });
  assert(validTask.success === true, 'Valid task payload passes Zod validation');

  // Invalid Task Status
  const invalidStatusTask = CreateTaskSchema.safeParse({
    projectId: 'p-1',
    assigneeId: 'm-1',
    title: 'Invalid Status Task',
    status: '<script>alert(1)</script>',
  });
  assert(invalidStatusTask.success === false, 'XSS/invalid status enum rejected by Zod');

  // Invalid Slip Cause
  const invalidSlipTask = CreateTaskSchema.safeParse({
    projectId: 'p-1',
    assigneeId: 'm-1',
    title: 'Invalid Slip Task',
    slipCause: 'UnknownInvalidCause',
  });
  assert(invalidSlipTask.success === false, 'Invalid slipCause enum rejected by Zod');

  // Empty Title
  const emptyTitleTask = CreateTaskSchema.safeParse({
    projectId: 'p-1',
    assigneeId: 'm-1',
    title: '   ',
  });
  assert(emptyTitleTask.success === false, 'Empty task title rejected by Zod');

  // Overly Long Title (>200 chars)
  const longTitleTask = CreateTaskSchema.safeParse({
    projectId: 'p-1',
    assigneeId: 'm-1',
    title: 'A'.repeat(250),
  });
  assert(longTitleTask.success === false, 'Task title exceeding 200 chars rejected');

  // Update Task Whitelisting
  const updateTaskData = UpdateTaskSchema.safeParse({
    title: 'Updated Title',
    status: 'Completed',
    // Injected fields that should NOT be in update schema
    userId: 'attacker-id',
    id: 'attacker-id',
  });
  assert(updateTaskData.success === true, 'Update task payload parses safely');
  assert(!('userId' in (updateTaskData.data as any)), 'Attacker injected userId stripped from update schema');
  assert(!('id' in (updateTaskData.data as any)), 'Attacker injected id stripped from update schema');
}

async function runDatabaseIntegrationTests() {
  console.log('\n--- 5. Database Multi-Tenancy & Integrity Tests ---');

  // Verify default workspace
  const workspace = await prisma.workspace.findUnique({ where: { id: 'default-workspace' } });
  assert(workspace !== null, 'Default workspace exists in database');

  // Verify Admin user
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@teamhq.com' } });
  assert(adminUser !== null, 'Admin user exists in database');
  assert(adminUser?.role === 'ADMIN', 'Admin user has ADMIN role in database');
  assert(adminUser?.passwordHash.startsWith('$2'), 'Admin password in database is bcrypt hashed');

  // Verify team members count
  const memberCount = await prisma.teamMember.count();
  assert(memberCount >= 11, `Database contains ${memberCount} team members`);

  // Verify projects count
  const projectCount = await prisma.project.count();
  assert(projectCount >= 12, `Database contains ${projectCount} projects`);

  // Verify tasks count
  const taskCount = await prisma.task.count();
  assert(taskCount >= 45, `Database contains ${taskCount} deliverables`);

  // Soft Deactivation Test: Ensure deleting a member with tasks sets status to Inactive instead of wiping deliverables
  const sampleMember = await prisma.teamMember.findFirst({
    where: { tasks: { some: {} } },
    include: { tasks: true },
  });

  if (sampleMember) {
    const taskCountBefore = await prisma.task.count({ where: { assigneeId: sampleMember.id } });
    assert(taskCountBefore > 0, `Sample member ${sampleMember.name} has ${taskCountBefore} historical tasks`);

    // Verify relation constraint: foreign key prevents silent cascade delete
    let threw = false;
    try {
      await prisma.teamMember.delete({ where: { id: sampleMember.id } });
    } catch {
      threw = true;
    }
    assert(threw, 'Direct deletion of member with tasks is restricted by database constraint');
  }
}

async function main() {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  TeamHQ Production Readiness Test Suite');
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('════════════════════════════════════════════════════════════════════');

  try {
    await runAuthTests();
    await runRbacTests();
    await runEngineTests();
    await runValidationTests();
    await runDatabaseIntegrationTests();

    console.log('\n════════════════════════════════════════════════════════════════════');
    console.log(`  TEST RESULTS: ${passedTests} passed, ${failedTests} failed`);
    console.log('════════════════════════════════════════════════════════════════════\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during test run:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
