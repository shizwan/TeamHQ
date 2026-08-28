import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import os from 'os';

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  try {
    const srcPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const tmpPath = path.join(os.tmpdir(), 'dev.db');
    if (fs.existsSync(srcPath) && (!fs.existsSync(tmpPath) || fs.statSync(srcPath).mtimeMs > fs.statSync(tmpPath).mtimeMs)) {
      fs.copyFileSync(srcPath, tmpPath);
    }
    process.env.DATABASE_URL = fs.existsSync(tmpPath) ? `file:${tmpPath}` : `file:${srcPath}`;
  } catch (err) {
    console.error('Failed to copy database to tmp:', err);
    process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
  }
} else {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('postgresql:')) {
    process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
