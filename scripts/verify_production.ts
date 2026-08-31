import { 
  generateDeliverableId, 
  generateNextDeliverableId, 
  parseTimeString,
  formatTimeString,
  parseDateWithTime,
  calculateDaysActive,
  calculateDelayHours,
  calculateOnTimeStatus,
  calculateLifecycleStatus,
  calculateTeamPerformance,
  calculateProjectPerformance,
  calculateGlobalTaskMetrics,
  calculateTaskDelayDetailed,
} from '../src/lib/trackerEngine';
import { matchesMonth } from '../src/lib/validation';
import type { Task, TeamMember, Project } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details || '');
    failed++;
  }
}

console.log('====================================================');
console.log('🧪 RUNNING PRODUCTION-READINESS AUDIT VERIFICATION');
console.log('====================================================\n');

// 1. Deliverable ID Generation Tests
console.log('1. Deliverable ID Generation & Monotonicity');
assert(generateDeliverableId(1) === 'DLV-000001', 'generateDeliverableId(1) gives DLV-000001');
assert(generateDeliverableId(45) === 'DLV-000045', 'generateDeliverableId(45) gives DLV-000045');

const existingIds = ['DLV-000001', 'DLV-000002', 'DLV-000045'];
assert(generateNextDeliverableId(existingIds) === 'DLV-000046', 'generateNextDeliverableId after 45 gives DLV-000046');

// Test resilience against non-sequential list with gaps (e.g. deletion of DLV-000002)
const deletedIds = ['DLV-000001', 'DLV-000045'];
assert(generateNextDeliverableId(deletedIds) === 'DLV-000046', 'generateNextDeliverableId ignores gaps and finds max');

const emptyIds: string[] = [];
assert(generateNextDeliverableId(emptyIds) === 'DLV-000001', 'generateNextDeliverableId on empty list gives DLV-000001');

// 2. Timezone & ETA Parsing Tests
console.log('\n2. Timezone-Agnostic Date & Time Parsing');
const parsedTime1 = parseTimeString('10:00 PM');
assert(parsedTime1.hours === 22 && parsedTime1.minutes === 0, 'parseTimeString 10:00 PM is 22:00');

const parsedTime2 = parseTimeString('07:30 AM');
assert(parsedTime2.hours === 7 && parsedTime2.minutes === 30, 'parseTimeString 07:30 AM is 07:30');

const parsedTime3 = parseTimeString('19:45');
assert(parsedTime3.hours === 19 && parsedTime3.minutes === 45, 'parseTimeString 24h 19:45 is 19:45');

const testDate = parseDateWithTime('2026-08-25', '07:00 PM');
assert(testDate !== null, 'parseDateWithTime returned valid Date');
if (testDate) {
  assert(testDate.getFullYear() === 2026, 'Year matches 2026');
  assert(testDate.getMonth() === 7, 'Month matches August (7)');
  assert(testDate.getDate() === 25, 'Date matches 25th (no UTC offset shift)');
  assert(testDate.getHours() === 19, 'Hours match 19:00 (7 PM)');
}

// 3. Delay Hours & Live Completion Calculation
console.log('\n3. Delay Hours & Live Completion Calculation');
// Case A: Completed on-time (target: 2026-08-25 10:00 PM, actual: 2026-08-25 04:00 PM)
const delay1 = calculateDelayHours('2026-08-25', '10:00 PM', '2026-08-25', '04:00 PM', 'Completed');
assert(delay1 === 0, 'Same-day earlier completion delay is 0 hrs');

// Case B: Completed 3 hrs late on same day (target: 2026-08-25 07:00 PM, actual: 2026-08-25 10:00 PM)
const delay2 = calculateDelayHours('2026-08-25', '07:00 PM', '2026-08-25', '10:00 PM', 'Completed');
assert(delay2 === 3, 'Same-day 3h late completion delay is 3 hrs');

// Case C: Completed 91 hrs late across multiple days (target: 2026-08-24 07:00 PM, actual: 2026-08-28 02:00 PM)
const delay3 = calculateDelayHours('2026-08-24', '07:00 PM', '2026-08-28', '02:00 PM', 'Completed');
assert(delay3 === 91, 'Multi-day late completion delay is 91 hrs (DLV-000037 case)');

// 4. On-Time Status and Lifecycle Badges
console.log('\n4. On-Time Status & Lifecycle Badges');
assert(calculateOnTimeStatus('Completed', '2026-08-25', '10:00 PM', '2026-08-25', '04:00 PM') === 'Yes', 'On-time completion evaluated as Yes');
assert(calculateOnTimeStatus('Completed', '2026-08-24', '07:00 PM', '2026-08-28', '02:00 PM') === 'No', 'Delayed completion evaluated as No');
assert(calculateOnTimeStatus('Cancelled', '2026-08-24', '07:00 PM') === 'Unverified', 'Cancelled task evaluated as Unverified');

assert(calculateLifecycleStatus('Completed', 'Yes', 'N/A', 0) === '🟢 On-Time', 'Lifecycle is On-Time');
assert(calculateLifecycleStatus('Completed', 'No', 'Developer', 91) === '🔴 Delayed', 'Lifecycle is Delayed');
assert(calculateLifecycleStatus('Carried Forward', 'Pending', 'Scope Drift', 0) === '🔴 Carried Fwd', 'Lifecycle is Carried Fwd');
assert(calculateLifecycleStatus('Cancelled', 'Unverified', 'N/A', 0) === '⚪ Cancelled', 'Lifecycle is Cancelled');

// 5. Team Performance & Developer Zero-Penalty Rule
console.log('\n5. Team Performance Matrix & Rating Rule Hardening');
const sampleTeam: TeamMember[] = [
  { id: 'm1', name: 'Danish (New/Active)', role: 'Frontend Dev', department: 'Product', status: 'Active', manager: 'Shizwan', createdAt: new Date().toISOString() },
  { id: 'm2', name: 'Moin (Top Performer)', role: 'Lead Architect', department: 'Core', status: 'Active', manager: 'Shizwan', createdAt: new Date().toISOString() },
  { id: 'm3', name: 'Nisar (With Slips)', role: 'Backend Dev', department: 'Core', status: 'Active', manager: 'Shizwan', createdAt: new Date().toISOString() },
  { id: 'm4', name: 'Standby Member', role: 'DevOps', department: 'Infra', status: 'Active', manager: 'Shizwan', createdAt: new Date().toISOString() },
];

const sampleTasks: Task[] = [
  // Danish: 1 active task, 0 completed, 0 slips, 0 carried forward -> MUST BE Satisfactory (NOT Action Required)
  { id: 't1', deliverableId: 'DLV-000001', projectId: 'p1', assigneeId: 'm1', title: 'Task 1', status: 'In Progress', slipCause: 'N/A', startDate: '2026-08-25', targetDueDate: '2026-09-01', targetDueTime: '10:00 PM', daysActive: 1, delayHours: 0, onTimeStatus: 'Pending', lifecycleStatus: '🟢 In Progress', createdAt: '2026-08-25', updatedAt: '2026-08-25' },
  
  // Moin: 3 completed on-time, 0 slips, 0 carried forward -> Top Performer
  { id: 't2', deliverableId: 'DLV-000002', projectId: 'p1', assigneeId: 'm2', title: 'Task 2', status: 'Completed', slipCause: 'N/A', startDate: '2026-08-20', targetDueDate: '2026-08-25', targetDueTime: '10:00 PM', completedDate: '2026-08-24', completedTime: '04:00 PM', daysActive: 4, delayHours: 0, onTimeStatus: 'Yes', lifecycleStatus: '🟢 On-Time', createdAt: '2026-08-20', updatedAt: '2026-08-24' },
  { id: 't3', deliverableId: 'DLV-000003', projectId: 'p1', assigneeId: 'm2', title: 'Task 3', status: 'Completed', slipCause: 'N/A', startDate: '2026-08-20', targetDueDate: '2026-08-25', targetDueTime: '10:00 PM', completedDate: '2026-08-25', completedTime: '06:00 PM', daysActive: 5, delayHours: 0, onTimeStatus: 'Yes', lifecycleStatus: '🟢 On-Time', createdAt: '2026-08-20', updatedAt: '2026-08-25' },
  
  // Nisar: 1 slip logged -> Action Required
  { id: 't4', deliverableId: 'DLV-000004', projectId: 'p1', assigneeId: 'm3', title: 'Task 4', status: 'Completed', slipCause: 'Scope Drift', startDate: '2026-08-20', targetDueDate: '2026-08-24', targetDueTime: '07:00 PM', completedDate: '2026-08-28', completedTime: '02:00 PM', daysActive: 8, delayHours: 91, onTimeStatus: 'No', lifecycleStatus: '🔴 Delayed', createdAt: '2026-08-20', updatedAt: '2026-08-28' },
];

const perfResults = calculateTeamPerformance(sampleTeam, sampleTasks);
const danishPerf = perfResults.find(p => p.id === 'm1')!;
const moinPerf = perfResults.find(p => p.id === 'm2')!;
const nisarPerf = perfResults.find(p => p.id === 'm3')!;
const standbyPerf = perfResults.find(p => p.id === 'm4')!;

assert(danishPerf.performanceRating === '🟡 Satisfactory', 'Danish (0 completed, 0 slips) is rated Satisfactory');
assert(danishPerf.onTimeRate === 1.0, 'Danish onTimeRate is 1.0 (not 0%)');
assert(moinPerf.performanceRating === '🟢 Top Performer', 'Moin (2+ completed on-time, 0 slips) is Top Performer');
assert(nisarPerf.performanceRating === '🔴 Action Required', 'Nisar (slips logged) is Action Required');
assert(standbyPerf.performanceRating === '⚪ Standby', 'Standby member (0 tasks) is Standby');

// 6. Monthly Reports Filter Tests
console.log('\n6. Monthly Review Period Filtering');
assert(matchesMonth('2026-08-25T00:00:00.000Z', '2026-08') === true, 'matchesMonth matches ISO August');
assert(matchesMonth('2026-09-01', '2026-08') === false, 'matchesMonth rejects September for August review');
assert(matchesMonth(new Date(2026, 7, 25), '2026-08') === true, 'matchesMonth matches Date object');
assert(matchesMonth(null, '2026-08') === false, 'matchesMonth returns false for null');

// 7. Global Task Metrics Counter Reconciliation
console.log('\n7. Global Task Metrics Counter Reconciliation');
const sampleProjects: Project[] = [{ id: 'p1', title: 'HQ', priority: 'High', status: 'Active', leadOwner: 'Shizwan', startDate: '2026-08-01', targetDate: '2026-09-01', createdAt: new Date().toISOString() }];
const globalMetrics = calculateGlobalTaskMetrics(sampleTasks);
assert(globalMetrics.total === 4, 'Global metrics total is 4');
assert(globalMetrics.completed === 3, 'Global metrics completed is 3');
assert(globalMetrics.inProgress === 1, 'Global metrics inProgress is 1');
assert(globalMetrics.carriedForward === 0, 'Global metrics carriedForward is 0');

console.log('\n====================================================');
console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
