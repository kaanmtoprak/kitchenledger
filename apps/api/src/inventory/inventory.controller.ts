import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { TenantContext } from '../common/types/tenant-context.type';
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
}
