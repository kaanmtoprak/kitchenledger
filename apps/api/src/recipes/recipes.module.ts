import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { RecipeCostService } from './recipe-cost.service';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [RecipesController],
  providers: [RecipesService, RecipeCostService],
  exports: [RecipeCostService],
})
export class RecipesModule {}
