import type { PaginatedResponse } from '@/features/branches/types/branch.types';
import type { RecipeCostResponse } from '@/features/recipes/types/recipe.types';

export type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  defaultServingCount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductDetail = Product & {
  recipe: {
    id: string;
    name: string;
    yieldQuantity: string;
    yieldUnit: string;
    createdAt: string;
  } | null;
};

export type ListProductsParams = {
  page?: number;
  limit?: number;
  q?: string;
  includeInactive?: boolean;
};

export type CreateProductPayload = {
  name: string;
  sku: string;
  description?: string;
  defaultServingCount?: number;
};

export type UpdateProductPayload = {
  name?: string;
  sku?: string;
  description?: string;
  defaultServingCount?: number;
  isActive?: boolean;
};

export type ProductCostParams = {
  branchId: string;
};

export type ProductsListResponse = PaginatedResponse<Product>;

export type ProductCostResponse = RecipeCostResponse;
