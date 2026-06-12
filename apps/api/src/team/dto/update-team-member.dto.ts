import { Role } from '@kitchenledger/db';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
