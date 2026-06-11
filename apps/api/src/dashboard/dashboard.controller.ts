import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { TenantContext } from '../common/types/tenant-context.type';
import { DashboardService } from './dashboard.service';
import {
  DashboardDateQueryDto,
  DashboardLowStockQueryDto,
  DashboardRecentActivityQueryDto,
  DashboardTopItemsQueryDto,
} from './dto/dashboard-query.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: DashboardDateQueryDto,
  ) {
    return this.dashboardService.getSummary(tenant, query);
  }

  @Get('low-stock')
  getLowStock(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: DashboardLowStockQueryDto,
  ) {
    return this.dashboardService.getLowStock(tenant, query);
  }

  @Get('production-trend')
  getProductionTrend(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: DashboardDateQueryDto,
  ) {
    return this.dashboardService.getProductionTrend(tenant, query);
  }

  @Get('top-products-by-cost')
  getTopProductsByCost(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: DashboardTopItemsQueryDto,
  ) {
    return this.dashboardService.getTopProductsByCost(tenant, query);
  }

  @Get('purchase-summary-by-supplier')
  getPurchaseSummaryBySupplier(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: DashboardTopItemsQueryDto,
  ) {
    return this.dashboardService.getPurchaseSummaryBySupplier(tenant, query);
  }

  @Get('recent-activity')
  getRecentActivity(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: DashboardRecentActivityQueryDto,
  ) {
    return this.dashboardService.getRecentActivity(tenant, query);
  }
}
