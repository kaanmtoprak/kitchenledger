import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { CommonModule } from './common/common.module';
import { env } from './config/env';
import { DashboardModule } from './dashboard/dashboard.module';
import { DebugModule } from './debug/debug.module';
import { HealthModule } from './health/health.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductionsModule } from './productions/productions.module';
import { ProductsModule } from './products/products.module';
import { PurchasesModule } from './purchases/purchases.module';
import { RecipesModule } from './recipes/recipes.module';
import { SuppliersModule } from './suppliers/suppliers.module';

const devOnlyModules = env.isProduction ? [] : [DebugModule];

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CommonModule,
    HealthModule,
    ...devOnlyModules,
    BranchesModule,
    SuppliersModule,
    IngredientsModule,
    PurchasesModule,
    OrdersModule,
    InventoryModule,
    ProductsModule,
    RecipesModule,
    ProductionsModule,
    DashboardModule,
  ],
})
export class AppModule {}
