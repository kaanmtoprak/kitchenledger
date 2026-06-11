import { BaseUnit } from '@kitchenledger/db';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsEnum(BaseUnit)
  baseUnit?: BaseUnit;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @Min(0)
  minimumStockLevel?: number | string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
