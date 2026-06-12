import { PurchaseStatus } from '@kitchenledger/db';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { parseBooleanQuery } from '../../common/utils/boolean.util';

export class ListPurchasesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  includeItems?: boolean = false;

  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;
}
