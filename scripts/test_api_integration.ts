import { prisma } from '../src/lib/prisma';
import { generateNextDeliverableId, calculateDelayHours, calculateOnTimeStatus, calculateLifecycleStatus, formatTimeString } from '../src/lib/trackerEngine';

async function runIntegrationTest() {
  console.log('Testing Database & API Operations Integration...');

  // 1. Check existing deliverables count & max ID
  const tasks = await prisma.task.findMany({ select: { deliverableId: true } });
  console.log(`Found ${tasks.length} existing tasks in database.`);
  
  const nextId = generateNextDeliverableId(tasks.map(t => t.deliverableId));
  console.log(`Computed Next Deliverable ID: ${nextId}`);

  // Fetch an existing project & member
  const project = await prisma.project.findFirst();
  const member = await prisma.teamMember.findFirst();

  if (!project || !member) {
    throw new Error('Project or Member not found in database');
  }

  // 2. Create a new task with computed monotonic ID
  const startDate = new Date();
  const targetDueDate = new Date(Date.now() + 86400000); // tomorrow
  const targetDueTime = '10:00 PM';
  const status = 'In Progress';
  const delayHours = calculateDelayHours(targetDueDate, targetDueTime, null, null, status);
  const onTimeStatus = calculateOnTimeStatus(status, targetDueDate, targetDueTime, null, null);
  const lifecycleStatus = calculateLifecycleStatus(status, onTimeStatus, 'N/A', delayHours);

  const createdTask = await prisma.task.create({
    data: {
      userId: 'admin-user',
      deliverableId: nextId,
      projectId: project.id,
      assigneeId: member.id,
      title: 'Integration Test Deliverable Auto-DLV',
      status,
      slipCause: 'N/A',
      startDate,
      targetDueDate,
      targetDueTime,
      daysActive: 1,
      delayHours,
      onTimeStatus,
      lifecycleStatus,
    }
  });

  console.log(`✅ Successfully created deliverable ${createdTask.deliverableId} (ID: ${createdTask.id})`);

  // 3. Mark the task as Completed with live completion time
  const completedDate = new Date();
  const completedTime = formatTimeString(completedDate);
  const compDelay = calculateDelayHours(targetDueDate, targetDueTime, completedDate, completedTime, 'Completed');
  const compOnTime = calculateOnTimeStatus('Completed', targetDueDate, targetDueTime, completedDate, completedTime);
  const compLifecycle = calculateLifecycleStatus('Completed', compOnTime, 'N/A', compDelay);

  const updatedTask = await prisma.task.update({
    where: { id: createdTask.id },
    data: {
      status: 'Completed',
      completedDate,
      completedTime,
      completedAt: completedDate,
      delayHours: compDelay,
      onTimeStatus: compOnTime,
      lifecycleStatus: compLifecycle,
    }
  });

  console.log(`✅ Successfully updated deliverable to Completed. Status: ${updatedTask.status}, Completed Time: ${updatedTask.completedTime}, On-Time: ${updatedTask.onTimeStatus}, Delay: ${updatedTask.delayHours}h`);

  // 4. Delete the test task
  await prisma.task.delete({ where: { id: createdTask.id } });
  console.log(`✅ Successfully deleted test deliverable ${createdTask.deliverableId}`);

  console.log('🎉 All Database & Operational CRUD operations verified successfully!');
}

runIntegrationTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Integration Test Error:', err);
    process.exit(1);
  });
