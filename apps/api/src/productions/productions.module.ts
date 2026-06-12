import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { ProductionsController } from './productions.controller';
import { ProductionsService } from './productions.service';

@Module({
  imports: [AuthModule, CommonModule, AuditModule],
  controllers: [ProductionsController],
  providers: [ProductionsService],
})
export class ProductionsModule {}
