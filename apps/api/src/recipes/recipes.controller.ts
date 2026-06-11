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
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { TenantContext } from '../common/types/tenant-context.type';
import { CalculateRecipeCostQueryDto } from './dto/calculate-recipe-cost-query.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

@Controller('recipes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListRecipesQueryDto,
  ) {
    return this.recipesService.list(tenant, query);
  }

  @Get(':id/cost')
  calculateCost(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Query() query: CalculateRecipeCostQueryDto,
  ) {
    return this.recipesService.calculateCost(tenant, id, query.branchId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.recipesService.findOne(tenant, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.STAFF)
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(tenant, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.STAFF)
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(tenant, id, dto);
  }
}
