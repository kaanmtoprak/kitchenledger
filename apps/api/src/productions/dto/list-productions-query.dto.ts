import { ProductionStatus } from '@kitchenledger/db';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListProductionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(ProductionStatus)
  status?: ProductionStatus;
}
