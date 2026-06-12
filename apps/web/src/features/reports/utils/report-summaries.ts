import {
  calculateItemsTotal,
  type PurchaseListItem,
} from '@/features/purchases/types/purchase.types';
import type { ProductionListItem } from '@/features/productions/types/production.types';
import type { StockMovementItem } from '@/features/inventory/types/inventory.types';
import type { OrderListItem } from '@/features/orders/types/order.types';
import { formatOrderStatus } from '@/lib/utils/display';

export function summarizePurchases(purchases: PurchaseListItem[]) {
  const activePurchases = purchases.filter((purchase) => purchase.status === 'ACTIVE');
  const purchaseCount = activePurchases.length;
  const itemCount = activePurchases.reduce(
    (sum, purchase) => sum + (purchase.items?.length ?? 0),
    0,
  );
  const totalAmount = activePurchases.reduce(
    (sum, purchase) => sum + calculateItemsTotal(purchase.items),
    0,
  );
  const averageAmount = purchaseCount > 0 ? totalAmount / purchaseCount : 0;

  return { purchaseCount, itemCount, totalAmount, averageAmount };
}

export function summarizeProductions(productions: ProductionListItem[]) {
  const productionCount = productions.length;
  const totalQuantity = productions.reduce((sum, row) => {
    const value = Number.parseFloat(row.quantityProduced ?? '');
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);
  const totalCost = productions.reduce((sum, row) => {
    const value = Number.parseFloat(row.totalCostSnapshot ?? '');
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);
  const averageUnitCost = totalQuantity > 0 && totalCost > 0 ? totalCost / totalQuantity : 0;

  return { productionCount, totalQuantity, totalCost, averageUnitCost };
}

export function summarizeStockMovements(movements: StockMovementItem[]) {
  const movementCount = movements.length;
  const purchaseCount = movements.filter((row) => row.type === 'PURCHASE').length;
  const productionCount = movements.filter((row) => row.type === 'PRODUCTION_CONSUMPTION').length;
  const adjustmentCount = movements.filter((row) =>
    ['WASTE', 'RETURN', 'MANUAL_ADJUSTMENT'].includes(row.type),
  ).length;

  return { movementCount, purchaseCount, productionCount, adjustmentCount };
}

export function summarizeOrders(orders: OrderListItem[]) {
  const orderCount = orders.length;
  const totalAmount = orders.reduce((sum, order) => {
    const value = Number.parseFloat(order.totalAmount);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);
  const averageAmount = orderCount > 0 ? totalAmount / orderCount : 0;

  const statusBreakdown = orders.reduce<Record<string, number>>((acc, order) => {
    const label = formatOrderStatus(order.status);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return { orderCount, totalAmount, averageAmount, statusBreakdown };
}

export function getMovementUnitCost(movement: StockMovementItem): number | null {
  const unitCost = movement.stockBatch?.unitCost;
  if (!unitCost) {
    return null;
  }

  const value = Number.parseFloat(unitCost);
  return Number.isNaN(value) ? null : value;
}

export function getMovementTotalCost(movement: StockMovementItem): number | null {
  const unitCost = getMovementUnitCost(movement);
  if (unitCost === null) {
    return null;
  }

  const quantity = Number.parseFloat(movement.quantity);
  if (Number.isNaN(quantity)) {
    return null;
  }

  return unitCost * quantity;
}
