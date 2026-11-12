import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service.js';

export interface HealthStatus {
  status: 'ok';
  database: 'up';
}

/**
 * Readiness check used by Docker Compose and CI: the API counts as healthy
 * only when it can reach the database. Probes poll it constantly, so it
 * is exempt from rate limiting.
 */
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'The API and its database are reachable' })
  @ApiServiceUnavailableResponse({ description: 'The database is unreachable' })
  async check(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('The database is unreachable');
    }
    return { status: 'ok', database: 'up' };
  }
}
