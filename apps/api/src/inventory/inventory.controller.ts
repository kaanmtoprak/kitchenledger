import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@kitchenledger/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { TenantContext } from '../common/types/tenant-context.type';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { ListStockBatchesQueryDto } from './dto/list-stock-batches-query.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import { ListStockQueryDto } from './dto/list-stock-query.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  listStock(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListStockQueryDto,
  ) {
    return this.inventoryService.listStockSummary(tenant, query);
  }

  @Get('batches')
  listBatches(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListStockBatchesQueryDto,
  ) {
    return this.inventoryService.listBatches(tenant, query);
  }

  @Get('movements')
  listMovements(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListStockMovementsQueryDto,
  ) {
    return this.inventoryService.listMovements(tenant, query);
  }

  @Post('adjustments')
  @UseGuards(BranchAccessGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.STAFF)
  createAdjustment(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    return this.inventoryService.createAdjustment(tenant, dto);
  }
}
