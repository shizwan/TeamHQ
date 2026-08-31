import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters long for cryptographic security'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ADMIN_EMAIL: z.string().email().optional().default('admin@teamhq.com'),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_SECRET: z.string().optional(),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),
});

let parsedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (parsedEnv) return parsedEnv;

  const rawAuthSecret = process.env.AUTH_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && (!rawAuthSecret || rawAuthSecret.length < 32)) {
    throw new Error('[CRITICAL CONFIG ERROR] AUTH_SECRET environment variable is missing or less than 32 characters in production!');
  }

  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV || 'development',
    AUTH_SECRET: rawAuthSecret || 'teamhq_dev_only_secret_32_characters_long_for_dev_mode!',
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@teamhq.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  });

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    if (isProd) {
      throw new Error(`[CRITICAL CONFIG ERROR] Production environment validation failed: ${issues}`);
    }
    parsedEnv = {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      AUTH_SECRET: 'teamhq_dev_only_secret_32_characters_long_for_dev_mode!',
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@teamhq.com',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      ADMIN_SECRET: process.env.ADMIN_SECRET,
      APP_URL: process.env.APP_URL || 'http://localhost:3000',
    };
  } else {
    parsedEnv = result.data;
  }

  return parsedEnv;
}

export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';
