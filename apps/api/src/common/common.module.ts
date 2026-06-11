import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BranchAccessGuard } from './guards/branch-access.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { BranchAccessService } from './services/branch-access.service';
import { IngredientCostService } from './services/ingredient-cost.service';
import { StockConsumptionService } from './services/stock-consumption.service';

@Module({
  imports: [AuthModule],
  providers: [
    TenantGuard,
    RolesGuard,
    BranchAccessGuard,
    BranchAccessService,
    IngredientCostService,
    StockConsumptionService,
  ],
  exports: [
    TenantGuard,
    RolesGuard,
    BranchAccessGuard,
    BranchAccessService,
    IngredientCostService,
    StockConsumptionService,
  ],
})
export class CommonModule {}
