import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @Public()
  check() {
    return this.healthService.check([() => this.db.pingCheck('database')]);
  }

  @Public()
  @Get('disk')
  checkDisk() {
    return this.healthService.check([
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.6 }),
    ]);
  }

  @Public()
  @Get('memory')
  checkMemory() {
    return this.healthService.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }

  @Public()
  @Get('memory_rss')
  checkMemoryRSS() {
    return this.healthService.check([
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }
}
