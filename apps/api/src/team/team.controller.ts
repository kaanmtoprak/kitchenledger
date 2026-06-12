import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@kitchenledger/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { TenantContext } from '../common/types/tenant-context.type';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamService } from './team.service';

@Controller('team')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  list(@CurrentTenant() tenant: TenantContext) {
    return this.teamService.list(tenant);
  }

  @Post()
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateTeamMemberDto,
  ) {
    return this.teamService.create(tenant, dto);
  }

  @Patch(':membershipId')
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(tenant, membershipId, dto);
  }
}
