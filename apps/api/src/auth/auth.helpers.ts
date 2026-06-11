import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { User } from '@kitchenledger/db';
import { env } from '../config/env';
import { SafeOrganization, SafeUser } from './types/auth-user.type';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const BCRYPT_ROUNDS = 10;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function slugifyOrganizationName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'organization';
}

export function buildUniqueSlug(baseSlug: string): string {
  const suffix = randomBytes(3).toString('hex');
  return `${baseSlug}-${suffix}`;
}

export function toSafeUser(
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>,
): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export function toSafeOrganization(
  organization: Pick<
    { id: string; name: string; slug: string },
    'id' | 'name' | 'slug'
  >,
): SafeOrganization {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function hashRefreshToken(token: string): Promise<string> {
  const digest = createHash('sha256').update(token).digest('hex');
  return bcrypt.hash(digest, BCRYPT_ROUNDS);
}

export async function verifyRefreshToken(
  token: string,
  refreshTokenHash: string,
): Promise<boolean> {
  const digest = createHash('sha256').update(token).digest('hex');
  return bcrypt.compare(digest, refreshTokenHash);
}

export function parseExpiresInToMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';

  const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return value * multipliers[unit];
}

export function getRefreshCookieOptions() {
  const domain = env.COOKIE_DOMAIN;

  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? ('none' as const) : ('lax' as const),
    path: '/',
    maxAge: parseExpiresInToMs(env.JWT_REFRESH_EXPIRES_IN),
    ...(domain ? { domain } : {}),
  };
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshCookieOptions());
}

export function clearRefreshTokenCookie(res: Response): void {
  const options = getRefreshCookieOptions();
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
    ...(options.domain ? { domain: options.domain } : {}),
  });
}
