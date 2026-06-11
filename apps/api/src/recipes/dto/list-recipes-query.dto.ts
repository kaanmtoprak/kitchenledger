import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListRecipesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  productId?: string;
}
