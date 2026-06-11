import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductionDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  quantityProduced!: string;

  @IsOptional()
  @IsDateString()
  producedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export function validateQuantityProduced(value: string): void {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('INVALID_QUANTITY');
  }
}
