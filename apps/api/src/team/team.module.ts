import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
