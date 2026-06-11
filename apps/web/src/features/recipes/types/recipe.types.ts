import type { PaginatedResponse } from '@/features/branches/types/branch.types';
import type { BaseUnit } from '@/features/ingredients/types/ingredient.types';

export type RecipeListItem = {
  id: string;
  productId: string;
  name: string;
  yieldQuantity: string | null;
  yieldUnit: BaseUnit;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  itemCount: number;
};

export type RecipeItem = {
  id: string;
  ingredientId: string;
  quantity: string | null;
  unit: BaseUnit;
  ingredient: {
    id: string;
    name: string;
    sku: string;
    baseUnit: BaseUnit;
  };
};

export type RecipeDetail = {
  id: string;
  productId: string;
  name: string;
  yieldQuantity: string | null;
  yieldUnit: BaseUnit;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    defaultServingCount: string;
  };
  items: RecipeItem[];
};

export type ListRecipesParams = {
  page?: number;
  limit?: number;
  q?: string;
  productId?: string;
};

export type CreateRecipeItemPayload = {
  ingredientId: string;
  quantity: string;
  unit: BaseUnit;
};

export type CreateRecipePayload = {
  productId: string;
  name: string;
  yieldQuantity: string;
  yieldUnit: BaseUnit;
  items: CreateRecipeItemPayload[];
};

export type UpdateRecipePayload = {
  name?: string;
  yieldQuantity?: string;
  yieldUnit?: BaseUnit;
  items?: CreateRecipeItemPayload[];
};

export type RecipeCostParams = {
  branchId: string;
};

export type CostItem = {
  ingredientId: string;
  ingredientName: string;
  sku: string;
  quantity: string | null;
  unit: BaseUnit;
  weightedAverageUnitCost: string | null;
  cost: string | null;
  isMissingCost: boolean;
};

export type RecipeCostResponse = {
  recipe: {
    id: string;
    name: string;
    product: {
      id: string;
      name: string;
      sku: string;
      defaultServingCount: string;
    };
    yieldQuantity: string | null;
    yieldUnit: BaseUnit;
  };
  branch: {
    id: string;
    name: string;
  };
  items: CostItem[];
  summary: {
    totalCost: string | null;
    unitCost: string;
    servingCost: string;
    hasMissingCosts: boolean;
  };
};

export type RecipesListResponse = PaginatedResponse<RecipeListItem>;
