import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Role } from '@kitchenledger/db';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildUniqueSlug,
  clearRefreshTokenCookie,
  hashPassword,
  hashRefreshToken,
  normalizeEmail,
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
  slugifyOrganizationName,
  toSafeOrganization,
  toSafeUser,
  verifyPassword,
  verifyRefreshToken,
} from './auth.helpers';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AccessTokenPayload,
  AuthUser,
  RefreshTokenPayload,
} from './types/auth-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    const email = normalizeEmail(dto.email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await hashPassword(dto.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
        },
      });

      const baseSlug = slugifyOrganizationName(dto.organizationName);
      let slug = baseSlug;
      const slugTaken = await tx.organization.findUnique({ where: { slug } });
      if (slugTaken) {
        slug = buildUniqueSlug(baseSlug);
      }

      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName.trim(),
          slug,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: Role.OWNER,
        },
      });

      const branch = await tx.branch.create({
        data: {
          organizationId: organization.id,
          name: 'Main Branch',
          code: 'MAIN',
        },
      });

      await tx.branchMember.create({
        data: {
          branchId: branch.id,
          userId: user.id,
          organizationId: organization.id,
        },
      });

      return { user, organization };
    });

    const tokens = await this.issueTokens(
      result.user.id,
      result.user.email,
      res,
    );

    return {
      accessToken: tokens.accessToken,
      user: toSafeUser(result.user),
      organization: toSafeOrganization(result.organization),
    };
  }

  async login(dto: LoginDto, res: Response) {
    const email = normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    const tokens = await this.issueTokens(user.id, user.email, res);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken: tokens.accessToken,
      user: toSafeUser(user),
    };
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: RefreshTokenPayload;

    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        isActive: true,
        refreshTokenHash: true,
      },
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await verifyRefreshToken(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user.id, user.email, res);

    return {
      accessToken: tokens.accessToken,
    };
  }

  async logout(req: Request, res: Response) {
    const userId = this.tryGetUserIdFromRequest(req);

    if (userId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      });
    }

    clearRefreshTokenCookie(res);

    return { success: true };
  }

  async me(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        memberships: {
          select: {
            organizationId: true,
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      user: toSafeUser(user),
      memberships: user.memberships.map((membership) => ({
        organizationId: membership.organizationId,
        role: membership.role,
        organization: toSafeOrganization(membership.organization),
      })),
    };
  }

  private async issueTokens(userId: string, email: string, res: Response) {
    const accessToken = this.signAccessToken({ sub: userId, email });
    const refreshToken = this.signRefreshToken({
      sub: userId,
      tokenType: 'refresh',
    });
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    setRefreshTokenCookie(res, refreshToken);

    return { accessToken, refreshToken };
  }

  private signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as JwtSignOptions['expiresIn'],
    });
  }

  private signRefreshToken(payload: RefreshTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as JwtSignOptions['expiresIn'],
    });
  }

  private getAccessSecret(): string {
    return env.JWT_ACCESS_SECRET;
  }

  private tryGetUserIdFromRequest(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(
        authHeader.slice(7),
        {
          secret: this.getAccessSecret(),
        },
      );
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
