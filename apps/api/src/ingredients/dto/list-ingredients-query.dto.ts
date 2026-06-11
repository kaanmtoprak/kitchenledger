import { BaseUnit } from '@kitchenledger/db';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListIngredientsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(BaseUnit)
  baseUnit?: BaseUnit;
}
