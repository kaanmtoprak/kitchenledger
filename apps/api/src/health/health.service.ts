import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  live() {
    return {
      status: 'ok',
      service: 'api',
    };
  }

  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'api',
        database: 'error',
        environment: env.NODE_ENV,
      });
    }

    return {
      status: 'ok',
      service: 'api',
      database: 'ok',
      environment: env.NODE_ENV,
    };
  }
}
