import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@kitchenledger/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { TenantContext } from '../common/types/tenant-context.type';

@Controller('debug')
export class DebugController {
  @Get('tenant')
  @UseGuards(JwtAuthGuard, TenantGuard)
  getTenant(@CurrentTenant() tenant: TenantContext) {
    return { tenant };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminOnly() {
    return { ok: true };
  }

  @Get('branch/:branchId')
  @UseGuards(JwtAuthGuard, TenantGuard, BranchAccessGuard)
  branchAccess(@Param('branchId') branchId: string) {
    return { branchId, access: true };
  }
}
