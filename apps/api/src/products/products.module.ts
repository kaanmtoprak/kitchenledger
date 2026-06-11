import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { RecipesModule } from '../recipes/recipes.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, CommonModule, RecipesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
