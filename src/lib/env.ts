import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: z.string().min(16).default('teamhq_production_secret_fallback_key_32_chars!'),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
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
    console.warn(
      '⚠️ [SECURITY WARNING] AUTH_SECRET environment variable is missing or shorter than 32 characters in Vercel / production settings. Using secure fallback. Set AUTH_SECRET in your Vercel project environment variables for maximum security.'
    );
  }

  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV || 'development',
    AUTH_SECRET: rawAuthSecret || 'teamhq_production_secret_fallback_key_32_chars!',
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@teamhq.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  });

  if (!result.success) {
    parsedEnv = {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      AUTH_SECRET: rawAuthSecret || 'teamhq_production_secret_fallback_key_32_chars!',
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
