import { StockMovementType } from '@kitchenledger/db';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum AdjustmentDirection {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
}

const ADJUSTMENT_TYPES = [
  StockMovementType.WASTE,
  StockMovementType.RETURN,
  StockMovementType.MANUAL_ADJUSTMENT,
] as const;

export type StockAdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

export class CreateStockAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @IsEnum(ADJUSTMENT_TYPES)
  type!: StockAdjustmentType;

  @ValidateIf((dto: CreateStockAdjustmentDto) => dto.type === StockMovementType.MANUAL_ADJUSTMENT)
  @IsEnum(AdjustmentDirection)
  adjustmentDirection?: AdjustmentDirection;

  @IsString()
  @IsNotEmpty()
  quantity!: string;

  @IsOptional()
  @IsString()
  unitCost?: string;

  @IsOptional()
  @IsString()
  stockBatchId?: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export function validateAdjustmentQuantity(quantity: string): void {
  const value = Number(quantity);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('INVALID_QUANTITY');
  }
}

export function validateAdjustmentUnitCost(unitCost: string): void {
  const value = Number(unitCost);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('INVALID_UNIT_COST');
  }
}
