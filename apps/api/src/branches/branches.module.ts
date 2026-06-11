import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
