import { Injectable } from '@nestjs/common';
import { Prisma } from '@kitchenledger/db';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IngredientCostService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeightedAverageUnitCost(
    organizationId: string,
    branchId: string,
    ingredientId: string,
  ): Promise<Prisma.Decimal | null> {
    const batches = await this.prisma.stockBatch.findMany({
      where: {
        organizationId,
        branchId,
        ingredientId,
        remainingQuantity: { gt: 0 },
      },
      select: {
        remainingQuantity: true,
        unitCost: true,
      },
    });

    if (batches.length === 0) {
      return null;
    }

    let sumQty = new Prisma.Decimal(0);
    let sumValue = new Prisma.Decimal(0);

    for (const batch of batches) {
      sumQty = sumQty.add(batch.remainingQuantity);
      sumValue = sumValue.add(batch.remainingQuantity.mul(batch.unitCost));
    }

    if (sumQty.isZero()) {
      return null;
    }

    return sumValue.div(sumQty);
  }
}
