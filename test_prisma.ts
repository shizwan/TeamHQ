import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.project.create({
      data: {
        userId: 'admin-user',
        title: 'Test',
        description: 'Test desc',
        status: 'Active',
        startDate: '2026-06-23T13:00',
        dueDate: null,
      }
    });
    console.log("Success:", result);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
