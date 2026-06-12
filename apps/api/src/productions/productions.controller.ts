import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@kitchenledger/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { TenantContext } from '../common/types/tenant-context.type';
import { CancelProductionDto } from './dto/cancel-production.dto';
import { CreateProductionDto } from './dto/create-production.dto';
import { ListProductionsQueryDto } from './dto/list-productions-query.dto';
import { ProductionsService } from './productions.service';

@Controller('productions')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductionsController {
  constructor(private readonly productionsService: ProductionsService) {}

  @Post()
  @UseGuards(BranchAccessGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.STAFF)
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateProductionDto,
  ) {
    return this.productionsService.create(tenant, dto);
  }

  @Get()
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListProductionsQueryDto,
  ) {
    return this.productionsService.list(tenant, query);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.productionsService.findOne(tenant, id);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.STAFF)
  cancel(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: CancelProductionDto,
  ) {
    return this.productionsService.cancel(tenant, id, dto);
  }
}
