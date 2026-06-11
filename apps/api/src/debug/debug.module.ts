import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DebugController } from './debug.controller';

@Module({
  imports: [CommonModule],
  controllers: [DebugController],
})
export class DebugModule {}
