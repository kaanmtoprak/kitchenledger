import {
  Body,
  Controller,
  Delete,
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
import { CalculateRecipeCostQueryDto } from '../recipes/dto/calculate-recipe-cost-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.list(tenant, query);
  }

  @Get(':id/cost')
  calculateCost(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Query() query: CalculateRecipeCostQueryDto,
  ) {
    return this.productsService.calculateCost(tenant, id, query.branchId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.productsService.findOne(tenant, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.STAFF)
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(tenant, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.STAFF)
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenant, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.productsService.softDelete(tenant, id);
  }
}
