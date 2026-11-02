import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: z.string().min(16),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  ADMIN_EMAIL: z.string().email().default('admin@teamhq.com'),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_SECRET: z.string().optional(),
  APP_URL: z.string().url().default('http://localhost:3000'),
});

// Development-only convenience; this must never sign tokens in production.
const LOCAL_ONLY_AUTH_SECRET = 'teamhq_local_development_only_secret_change_me';
let parsedEnv: z.infer<typeof envSchema> | null = null;

/**
 * Fail closed when production credentials are absent or insufficient.
 * This helper is exported for deterministic configuration regression tests.
 */
export function resolveAuthSecret(rawSecret: string | undefined, nodeEnv: string): string {
  const configured = rawSecret?.trim();
  if (nodeEnv === 'production') {
    if (!configured || configured.length < 32) {
      throw new Error('AUTH_SECRET must be configured with at least 32 random characters in production.');
    }
    if (configured === LOCAL_ONLY_AUTH_SECRET || configured === 'teamhq_production_secret_fallback_key_32_chars!') {
      throw new Error('A documented or development-only AUTH_SECRET may not be used in production.');
    }
    return configured;
  }

  if (configured && configured.length < 16) {
    throw new Error('AUTH_SECRET must contain at least 16 characters.');
  }
  return configured || LOCAL_ONLY_AUTH_SECRET;
}

export function getEnv() {
  if (parsedEnv) return parsedEnv;

  const nodeEnv = process.env.NODE_ENV || 'development';
  const result = envSchema.safeParse({
    NODE_ENV: nodeEnv,
    AUTH_SECRET: resolveAuthSecret(process.env.AUTH_SECRET, nodeEnv),
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@teamhq.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  });

  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment configuration (${fields || 'unknown field'}).`);
  }

  parsedEnv = result.data;
  return parsedEnv;
}

export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';
