import { BaseUnit } from '@kitchenledger/db';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRecipeItemDto {
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @IsString()
  @IsNotEmpty()
  quantity!: string;

  @IsEnum(BaseUnit)
  unit!: BaseUnit;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  yieldQuantity!: string;

  @IsEnum(BaseUnit)
  yieldUnit!: BaseUnit;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeItemDto)
  items!: CreateRecipeItemDto[];
}
