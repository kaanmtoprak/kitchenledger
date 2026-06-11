import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@kitchenledger/db';
import { Request } from 'express';
import { ROLES_KEY } from '../constants';
import { TenantContext } from '../types/tenant-context.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const tenant = request.tenant as TenantContext | undefined;

    if (!tenant) {
      throw new ForbiddenException('Tenant context is required');
    }

    if (tenant.role === Role.OWNER) {
      return true;
    }

    if (!requiredRoles.includes(tenant.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
