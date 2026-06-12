import { ConflictException, Injectable } from '@nestjs/common';
import { BaseUnit, Prisma } from '@kitchenledger/db';
import { PrismaService } from '../../prisma/prisma.service';
import { serializeDecimal } from '../utils/decimal.util';

export type InsufficientStockDetails = {
  ingredientName: string;
  requiredQuantity: string;
  availableQuantity: string;
  unit: BaseUnit;
};

export type FifoBatchPlan = {
  stockBatchId: string;
  consumedQuantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  cost: Prisma.Decimal;
};

export type IngredientConsumptionPlan = {
  ingredientId: string;
  ingredientName: string;
  unit: BaseUnit;
  requiredQuantity: Prisma.Decimal;
  batches: FifoBatchPlan[];
  totalCost: Prisma.Decimal;
};

type StockBatchRow = {
  id: string;
  remainingQuantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
};

@Injectable()
export class StockConsumptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableBatches(
    client: PrismaService | Prisma.TransactionClient,
    organizationId: string,
    branchId: string,
    ingredientId: string,
  ): Promise<StockBatchRow[]> {
    return client.stockBatch.findMany({
      where: {
        organizationId,
        branchId,
        ingredientId,
        remainingQuantity: { gt: 0 },
      },
      select: {
        id: true,
        remainingQuantity: true,
        unitCost: true,
      },
      orderBy: [{ receivedAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  planFifoConsumption(
    batches: StockBatchRow[],
    requiredQuantity: Prisma.Decimal,
  ): FifoBatchPlan[] | null {
    let remaining = requiredQuantity;
    const plan: FifoBatchPlan[] = [];

    for (const batch of batches) {
      if (remaining.lte(0)) {
        break;
      }

      if (batch.remainingQuantity.lte(0)) {
        continue;
      }

      const consumedQuantity = batch.remainingQuantity.lte(remaining)
        ? batch.remainingQuantity
        : remaining;
      const cost = consumedQuantity.mul(batch.unitCost);

      plan.push({
        stockBatchId: batch.id,
        consumedQuantity,
        unitCost: batch.unitCost,
        cost,
      });

      remaining = remaining.sub(consumedQuantity);
    }

    if (remaining.gt(0)) {
      return null;
    }

    return plan;
  }

  buildInsufficientStockDetails(
    ingredientName: string,
    unit: BaseUnit,
    required: Prisma.Decimal,
    available: Prisma.Decimal,
  ): InsufficientStockDetails {
    return {
      ingredientName,
      requiredQuantity: serializeDecimal(required)!,
      availableQuantity: serializeDecimal(available)!,
      unit,
    };
  }

  buildInsufficientStockMessage(
    ingredientName: string,
    unit: BaseUnit,
    required: Prisma.Decimal,
    available: Prisma.Decimal,
  ): string {
    const details = this.buildInsufficientStockDetails(
      ingredientName,
      unit,
      required,
      available,
    );
    return `Insufficient stock for ${details.ingredientName}. Required: ${details.requiredQuantity} ${details.unit}, available: ${details.availableQuantity} ${details.unit}`;
  }

  throwInsufficientStock(
    ingredientName: string,
    unit: BaseUnit,
    required: Prisma.Decimal,
    available: Prisma.Decimal,
  ): never {
    const details = this.buildInsufficientStockDetails(
      ingredientName,
      unit,
      required,
      available,
    );
    throw new ConflictException({
      code: 'INSUFFICIENT_STOCK',
      message: this.buildInsufficientStockMessage(
        ingredientName,
        unit,
        required,
        available,
      ),
      details,
    });
  }

  sumAvailableQuantity(batches: StockBatchRow[]): Prisma.Decimal {
    return batches.reduce(
      (total, batch) => total.add(batch.remainingQuantity),
      new Prisma.Decimal(0),
    );
  }

  assertSufficientStock(
    ingredientName: string,
    unit: BaseUnit,
    required: Prisma.Decimal,
    available: Prisma.Decimal,
  ): void {
    if (available.lt(required)) {
      this.throwInsufficientStock(ingredientName, unit, required, available);
    }
  }
}
