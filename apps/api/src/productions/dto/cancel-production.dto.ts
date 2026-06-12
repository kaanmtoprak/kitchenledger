import { IsNotEmpty, IsString } from 'class-validator';

export class CancelProductionDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
