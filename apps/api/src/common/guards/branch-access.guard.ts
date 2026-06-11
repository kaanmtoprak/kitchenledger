import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@kitchenledger/db';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../types/tenant-context.type';
import { extractBranchId } from '../utils/branch-id.util';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const tenant = request.tenant as TenantContext | undefined;

    if (!tenant) {
      throw new ForbiddenException('Tenant context is required');
    }

    const branchId = extractBranchId(request);
    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        organizationId: tenant.organizationId,
      },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (tenant.role === Role.OWNER || tenant.role === Role.ADMIN) {
      return true;
    }

    const branchMember = await this.prisma.branchMember.findUnique({
      where: {
        branchId_userId: {
          branchId,
          userId: tenant.userId,
        },
      },
      select: { id: true },
    });

    if (!branchMember) {
      throw new ForbiddenException('No access to this branch');
    }

    return true;
  }
}
