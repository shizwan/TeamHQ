import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// On Vercel / serverless environment, copy db to /tmp if needed for write access
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  try {
    const srcPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const tmpPath = '/tmp/dev.db';
    if (fs.existsSync(srcPath) && (!fs.existsSync(tmpPath) || fs.statSync(srcPath).mtimeMs > fs.statSync(tmpPath).mtimeMs)) {
      fs.copyFileSync(srcPath, tmpPath);
    }
    if (fs.existsSync(tmpPath)) {
      process.env.DATABASE_URL = `file:${tmpPath}`;
    }
  } catch (err) {
    console.error('Failed to copy database to /tmp:', err);
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
