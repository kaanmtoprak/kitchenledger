function requireEnv(name: string, aliases: string[] = []): string {
  const candidates = [name, ...aliases];
  for (const key of candidates) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing required environment variable: ${name}. ` +
      `Copy apps/api/.env.example to apps/api/.env and configure it.`,
  );
}

function optionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name]?.trim();
  return value || defaultValue;
}

function parseWebOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  WEB_ORIGIN: requireEnv('WEB_ORIGIN', ['CORS_ORIGIN']),
  PORT: Number(optionalEnv('PORT', '3001')),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  JWT_ACCESS_EXPIRES_IN: optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN?.trim() || undefined,
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },
  get webOrigins(): string[] {
    const origins = parseWebOrigins(this.WEB_ORIGIN);
    if (origins.length === 0) {
      throw new Error('WEB_ORIGIN must contain at least one valid origin URL.');
    }
    return origins;
  },
};
