import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ORGANIZATION_ID_HEADER } from '../constants';
import { AuthUser } from '../../auth/types/auth-user.type';
import { TenantContext } from '../types/tenant-context.type';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!user?.userId) {
      throw new UnauthorizedException();
    }

    const organizationId = this.getOrganizationId(request);
    if (!organizationId) {
      throw new BadRequestException(
        `${ORGANIZATION_ID_HEADER} header is required`,
      );
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
      select: {
        id: true,
        organizationId: true,
        role: true,
        organization: {
          select: { id: true },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('No access to this organization');
    }

    const tenant: TenantContext = {
      organizationId: membership.organizationId,
      membershipId: membership.id,
      role: membership.role,
      userId: user.userId,
    };

    request.tenant = tenant;

    return true;
  }

  private getOrganizationId(request: Request): string | undefined {
    const headerValue = request.headers[ORGANIZATION_ID_HEADER];

    if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
      return headerValue.trim();
    }

    if (Array.isArray(headerValue) && headerValue[0]?.trim()) {
      return headerValue[0].trim();
    }

    return undefined;
  }
}
