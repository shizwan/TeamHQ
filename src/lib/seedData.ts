import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { 
  calculateDaysActive, 
  calculateDelayHours, 
  calculateOnTimeStatus, 
  calculateLifecycleStatus 
} from '@/lib/trackerEngine';

export const INITIAL_MEMBERS = [
  { name: 'Moin', role: 'Fullstack Developer', department: 'Engineering', status: 'Active', manager: 'Shizwan' },
  { name: 'Nisar', role: 'Backend & CRM Lead', department: 'Engineering', status: 'Active', manager: 'Shizwan' },
  { name: 'Basit', role: 'UI/UX & Frontend Dev', department: 'Design & Frontend', status: 'Active', manager: 'Shizwan' },
  { name: 'Danish', role: 'Frontend Developer', department: 'Frontend', status: 'Active', manager: 'Shizwan' },
  { name: 'Saad', role: 'Frontend Developer', department: 'Frontend', status: 'Active', manager: 'Shizwan' },
  { name: 'Husnain', role: 'QA & Support Engineer', department: 'Quality Assurance', status: 'Active', manager: 'Shizwan' },
  { name: 'Athar', role: 'SEO & Fullstack Dev', department: 'Engineering & Marketing', status: 'Active', manager: 'Shizwan' },
  { name: 'Nimra', role: 'QA Automation Lead', department: 'Quality Assurance', status: 'Active', manager: 'Shizwan' },
  { name: 'Ammar', role: 'Mobile & Web Dev', department: 'Engineering', status: 'Active', manager: 'Shizwan' },
  { name: 'Tasbeeha', role: 'QA Engineer', department: 'Quality Assurance', status: 'Active', manager: 'Shizwan' },
  { name: 'Shizwan', role: 'Project Manager', department: 'Management', status: 'Active', manager: 'Shizwan' },
];

export const INITIAL_PROJECTS = [
  { title: 'Synopsis CRM Desktop', priority: 'High', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'ApxGP', priority: 'Critical', status: 'Active', leadOwner: 'Shizwan', targetDate: '2026-08-24' },
  { title: 'AtomCabs', priority: 'Medium', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'Regent', priority: 'Medium', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'Synopsis CRM Web Portal', priority: 'High', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'Rentigo', priority: 'High', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'Imam Connect', priority: 'Medium', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'PeopleGrid', priority: 'High', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'V-Arabia', priority: 'High', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'Global Skill Centre', priority: 'High', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'AHD', priority: 'High', status: 'Active', leadOwner: 'Shizwan' },
  { title: 'continental', priority: 'High', status: 'Active', leadOwner: 'Shizwan' },
];

export const INITIAL_DELIVERABLES = [
  { dlv_id: "DLV-000001", member: "Moin", project: "Synopsis CRM Desktop", title: "Enrolment Agent Decision Control Logic & Notes DB Wiring", start_date: "2026-08-27", target_date: "2026-08-27", target_time: "07:00 PM", status: "In Progress", slip_cause: "Developer", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000002", member: "Moin", project: "Synopsis CRM Desktop", title: "Intake Occupancy Selection Logic & Form Wiring", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "07:00 PM", status: "In Progress", slip_cause: "Developer", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000003", member: "Moin", project: "Synopsis CRM Desktop", title: "TimeTable Occupancy Multi-Select Logic", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "07:00 PM", status: "In Progress", slip_cause: "Developer", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000004", member: "Moin", project: "Synopsis CRM Desktop", title: "Student Attendance Percentage Filtering & Logic", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "07:00 PM", status: "In Progress", slip_cause: "Developer", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000005", member: "Moin", project: "Synopsis CRM Desktop", title: "Registered Student Advanced Search Logic & Filters", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "07:00 PM", status: "Carried Forward", slip_cause: "Developer", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000006", member: "Saad", project: "ApxGP", title: "Apex GP Landing Page Responsive & Section Polish", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "08:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000007", member: "Basit", project: "ApxGP", title: "Clinics UI Design Tokens & Grid Layout Polish", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "08:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000008", member: "Athar", project: "ApxGP", title: "SEO Meta Structure & OpenGraph Tags Integration", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "08:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000009", member: "Nisar", project: "Synopsis CRM Desktop", title: "Backend API Optimization for Heavy Student Reports", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "09:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000010", member: "Nimra", project: "Synopsis CRM Desktop", title: "QA Automation Test Suite for Student Enrolment", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "09:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000011", member: "Ammar", project: "Synopsis CRM Desktop", title: "Mobile View Portability & Responsive Grid Adjustments", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "09:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000012", member: "Tasbeeha", project: "Synopsis CRM Desktop", title: "Manual Regression Testing on Enrolment Decision Modal", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "09:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000013", member: "Husnain", project: "Synopsis CRM Desktop", title: "Live User Support & Bug Triage for CRM Beta Users", start_date: "2026-08-26", target_date: "2026-08-26", target_time: "09:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000014", member: "Moin", project: "Synopsis CRM Desktop", title: "Enrolment Decision Modal UI Implementation", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "07:00 PM", status: "Completed", slip_cause: "Developer", comp_date: "2026-08-25", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000015", member: "Nisar", project: "Synopsis CRM Desktop", title: "Database SP Optimization for Student Headcount Audit", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "07:00 PM", status: "In Progress", slip_cause: "Developer", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000016", member: "Saad", project: "ApxGP", title: "ApxGP Appointment Booking Form Redesign", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "08:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000017", member: "Basit", project: "ApxGP", title: "Services Catalog Visual Components", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "08:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000018", member: "Athar", project: "Global Skill Centre", title: "Global Skill Centre Landing Page SEO Optimization", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "08:00 PM", status: "Completed", slip_cause: "Scope Drift", comp_date: "2026-08-25", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000019", member: "Nimra", project: "ApxGP", title: "Automated Cypress Suite for Booking Flow", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "09:00 PM", status: "Carried Forward", slip_cause: "Environment/QA", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000020", member: "Ammar", project: "PeopleGrid", title: "PeopleGrid Mobile Layout Adjustments", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "09:00 PM", status: "Carried Forward", slip_cause: "Unplanned Task", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000021", member: "Tasbeeha", project: "ApxGP", title: "Form Validation & Cross-Browser Verification", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "09:00 PM", status: "In Progress", slip_cause: "Scope Drift", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000022", member: "Husnain", project: "ApxGP", title: "Client Feedback Integration & Verification", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "09:00 PM", status: "Carried Forward", slip_cause: "Dependency", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000023", member: "Basit", project: "ApxGP", title: "Fixes - Deployed", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-25", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000024", member: "Nisar", project: "Synopsis CRM Web Portal", title: "Fixes - Deployed", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-25", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000025", member: "Nisar", project: "Synopsis CRM Desktop", title: "Deployment", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-25", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000026", member: "Nisar", project: "Synopsis CRM Web Portal", title: "Reports completion", start_date: "2026-08-25", target_date: "2026-08-25", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-25", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000027", member: "Ammar", project: "ApxGP", title: "API & QA feedbacks", start_date: "2026-08-24", target_date: "2026-08-24", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-24", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000028", member: "Basit", project: "ApxGP", title: "clinics ui", start_date: "2026-08-24", target_date: null, target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000029", member: "Saad", project: "V-Arabia", title: "product listing page design", start_date: "2026-08-24", target_date: null, target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000030", member: "Athar", project: "Rentigo", title: "changes and feedback points", start_date: "2026-08-24", target_date: null, target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000031", member: "Nimra", project: "Rentigo", title: "Rentigo Bank QA & Account Verification", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000032", member: "Tasbeeha", project: "PeopleGrid", title: "PeopleGrid Employee Management & Onboarding QA", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000033", member: "Tasbeeha", project: "PeopleGrid", title: "Permission Module Testing", start_date: "2026-08-21", target_date: null, target_time: "10:00 PM", status: "Cancelled", slip_cause: "Dependency", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000034", member: "Athar", project: "Imam Connect", title: "ImamConnect Feedback Fixes for SEO Team", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000035", member: "Athar", project: "Rentigo", title: "Rentigo Viewber Integration & Research", start_date: "2026-08-21", target_date: null, target_time: "10:00 PM", status: "In Progress", slip_cause: "Dependency", comp_date: null, comp_time: "10:00 PM" },
  { dlv_id: "DLV-000036", member: "Nisar", project: "Synopsis CRM Desktop", title: "Received Payments to Date Report & CRM Online Deployment", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000037", member: "Nisar", project: "Synopsis CRM Desktop", title: "Completion of All Student & Finance Reports", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "Developer", comp_date: "2026-08-25", comp_time: "05:00 PM" },
  { dlv_id: "DLV-000038", member: "Moin", project: "Synopsis CRM Desktop", title: "CRM Setup Module (Course, Subject, ID Prefix Reg/Enroll, Logs)", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000039", member: "Basit", project: "ApxGP", title: "ApexGP Admin Dashboard UI", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000040", member: "Basit", project: "ApxGP", title: "Clinics UI Completion", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000041", member: "Saad", project: "V-Arabia", title: "V-Arabia Frontend Changes", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000042", member: "Saad", project: "ApxGP", title: "ApexGP Data Entry (Services, Blood Tests, Careers)", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000043", member: "Ammar", project: "ApxGP", title: "QA Feedbacks", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000044", member: "Husnain", project: "ApxGP", title: "Careers, Services, Blood Test & Consultation Enquiries Feedbacks", start_date: "2026-08-21", target_date: "2026-08-21", target_time: "10:00 PM", status: "Completed", slip_cause: "N/A", comp_date: "2026-08-21", comp_time: "10:00 PM" },
  { dlv_id: "DLV-000045", member: "Danish", project: "Rentigo", title: "Rentigo Frontend Development & Ongoing Enhancements", start_date: "2026-08-21", target_date: null, target_time: "10:00 PM", status: "In Progress", slip_cause: "N/A", comp_date: null, comp_time: "10:00 PM" }
];

export async function seedDatabase(adminEmail = 'admin@teamhq.com', adminPassword = 'password') {
  const workspaceId = 'default-workspace';

  return await prisma.$transaction(async (tx) => {
    // 1. Create Default Workspace
    await tx.workspace.upsert({
      where: { id: workspaceId },
      update: {},
      create: {
        id: workspaceId,
        name: 'TeamHQ Workspace',
        slug: 'teamhq',
      },
    });

    // 2. Create Default Admin User with Bcrypt Hash
    const passwordHash = await hashPassword(adminPassword);
    const adminUser = await tx.user.upsert({
      where: { email: adminEmail.trim().toLowerCase() },
      update: {
        name: 'Shizwan',
        role: 'ADMIN',
        active: true,
        workspaceId,
      },
      create: {
        email: adminEmail.trim().toLowerCase(),
        passwordHash,
        name: 'Shizwan',
        role: 'ADMIN',
        active: true,
        workspaceId,
      },
    });

    // 3. Clear and seed Team Members
    await tx.task.deleteMany({ where: { workspaceId } });
    await tx.project.deleteMany({ where: { workspaceId } });
    await tx.teamMember.deleteMany({ where: { workspaceId } });

    const memberMap: Record<string, string> = {};
    for (const m of INITIAL_MEMBERS) {
      const created = await tx.teamMember.create({
        data: {
          workspaceId,
          userId: adminUser.id,
          name: m.name,
          role: m.role,
          department: m.department,
          status: m.status,
          manager: m.manager,
        },
      });
      memberMap[m.name] = created.id;
    }

    // 4. Seed Projects
    const projectMap: Record<string, string> = {};
    for (const p of INITIAL_PROJECTS) {
      const created = await tx.project.create({
        data: {
          workspaceId,
          userId: adminUser.id,
          title: p.title,
          priority: p.priority,
          status: p.status,
          leadOwner: p.leadOwner,
          targetDate: p.targetDate ? new Date(p.targetDate) : null,
        },
      });
      projectMap[p.title] = created.id;
    }

    // 5. Seed Deliverables
    for (const d of INITIAL_DELIVERABLES) {
      const assigneeId = memberMap[d.member] || Object.values(memberMap)[0];
      const projectId = projectMap[d.project || 'ApxGP'] || Object.values(projectMap)[0];

      const startDate = d.start_date ? new Date(d.start_date) : new Date();
      const targetDueDate = d.target_date ? new Date(d.target_date) : null;
      const completedDate = d.comp_date ? new Date(d.comp_date) : null;

      const daysActive = calculateDaysActive(startDate, completedDate);
      const delayHours = calculateDelayHours(targetDueDate, d.target_time, completedDate, d.comp_time, d.status);
      const onTimeStatus = calculateOnTimeStatus(d.status, targetDueDate, d.target_time, completedDate, d.comp_time);
      const lifecycleStatus = calculateLifecycleStatus(d.status, onTimeStatus, d.slip_cause, delayHours);

      await tx.task.create({
        data: {
          workspaceId,
          userId: adminUser.id,
          deliverableId: d.dlv_id,
          projectId,
          assigneeId,
          title: d.title,
          status: d.status,
          slipCause: d.slip_cause,
          startDate,
          targetDueDate,
          targetDueTime: d.target_time,
          completedDate,
          completedTime: d.comp_time,
          daysActive,
          delayHours,
          onTimeStatus,
          lifecycleStatus,
          completedAt: d.status === 'Completed' ? (completedDate || new Date()) : null,
        },
      });
    }

    return {
      adminUser: { id: adminUser.id, email: adminUser.email },
      membersCount: INITIAL_MEMBERS.length,
      projectsCount: INITIAL_PROJECTS.length,
      tasksCount: INITIAL_DELIVERABLES.length,
    };
  });
}

export const seedDemoData = seedDatabase;
