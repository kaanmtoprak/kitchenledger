import type { PaginatedResponse } from '@/features/branches/types/branch.types';

export type BaseUnit = 'GRAM' | 'KILOGRAM' | 'MILLILITER' | 'LITER' | 'PIECE';

export type Ingredient = {
  id: string;
  name: string;
  sku: string;
  baseUnit: BaseUnit;
  minimumStockLevel: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListIngredientsParams = {
  page?: number;
  limit?: number;
  q?: string;
  includeInactive?: boolean;
  baseUnit?: BaseUnit;
};

export type CreateIngredientPayload = {
  name: string;
  sku: string;
  baseUnit: BaseUnit;
  minimumStockLevel?: string | null;
};

export type UpdateIngredientPayload = {
  name?: string;
  sku?: string;
  baseUnit?: BaseUnit;
  minimumStockLevel?: string | null;
  isActive?: boolean;
};

export type IngredientsListResponse = PaginatedResponse<Ingredient>;
