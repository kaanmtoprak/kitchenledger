import { Prisma } from '@kitchenledger/db';

type ZeroStockIngredient = {
  id: string;
  name: string;
  sku: string;
  baseUnit: string;
  minimumStockLevel: Prisma.Decimal;
};

type ZeroStockBranch = {
  id: string;
  name: string;
};

type ZeroStockRowTarget = {
  branchId: string;
  branchName: string;
  ingredientId: string;
  ingredientName: string;
  sku: string;
  unit: string;
  minimumStockLevel: Prisma.Decimal | null;
};

export function appendZeroStockMinimumRows<T extends ZeroStockRowTarget>(
  grouped: Map<string, T>,
  branches: ZeroStockBranch[],
  ingredients: ZeroStockIngredient[],
  createRow: (branch: ZeroStockBranch, ingredient: ZeroStockIngredient) => T,
): void {
  for (const branch of branches) {
    for (const ingredient of ingredients) {
      const key = `${branch.id}:${ingredient.id}`;
      if (grouped.has(key)) {
        continue;
      }
      grouped.set(key, createRow(branch, ingredient));
    }
  }
}

export function buildBranchWhere(
  organizationId: string,
  branchFilter: Prisma.StringFilter | string | undefined,
): Prisma.BranchWhereInput {
  return {
    organizationId,
    isActive: true,
    ...(typeof branchFilter === 'string'
      ? { id: branchFilter }
      : branchFilter !== undefined
        ? { id: branchFilter }
        : {}),
  };
}
