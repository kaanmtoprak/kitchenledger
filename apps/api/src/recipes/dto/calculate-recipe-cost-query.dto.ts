import { IsNotEmpty, IsString } from 'class-validator';

export class CalculateRecipeCostQueryDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;
}
