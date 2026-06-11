import { BaseUnit } from '@kitchenledger/db';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsEnum(BaseUnit)
  baseUnit!: BaseUnit;

  @IsOptional()
  @ValidateIf(
    (_, value) => value !== null && value !== undefined && value !== '',
  )
  @Type(() => Number)
  @Min(0)
  minimumStockLevel?: number | string | null;
}
