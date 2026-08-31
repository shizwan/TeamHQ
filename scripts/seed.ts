import { seedDatabase } from '../src/lib/seedData';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  TeamHQ Production Seeding & Workspace Setup');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@teamhq.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';

    const result = await seedDatabase(adminEmail, adminPassword);
    console.log(`✔ Workspace and Admin User setup complete: ${result.adminUser.email}`);
    console.log(`✔ Seeded ${result.membersCount} team members`);
    console.log(`✔ Seeded ${result.projectsCount} projects`);
    console.log(`✔ Seeded ${result.tasksCount} deliverables`);
    console.log('\nDatabase is ready for production usage.\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
