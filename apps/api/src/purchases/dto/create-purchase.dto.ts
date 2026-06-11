import { BaseUnit } from '@kitchenledger/db';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreatePurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @IsString()
  @IsNotEmpty()
  quantity!: string;

  @IsEnum(BaseUnit)
  unit!: BaseUnit;

  @IsString()
  @IsNotEmpty()
  totalPrice!: string;
}

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  purchasedAt?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items!: CreatePurchaseItemDto[];
}

export function validatePurchaseItemDecimals(
  item: CreatePurchaseItemDto,
): void {
  const quantity = Number(item.quantity);
  const totalPrice = Number(item.totalPrice);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('INVALID_QUANTITY');
  }

  if (!Number.isFinite(totalPrice) || totalPrice < 0) {
    throw new Error('INVALID_TOTAL_PRICE');
  }
}
