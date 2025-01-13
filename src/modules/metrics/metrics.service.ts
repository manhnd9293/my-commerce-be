import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { MonitorMetrics } from '../../utils/enums/monitorMetrics';
import { Gauge } from 'prom-client';

@Injectable()
export class MetricsService implements OnApplicationBootstrap {
  constructor(
    @InjectMetric(MonitorMetrics.RequestInProgress)
    private readonly requestInProgressGauge: Gauge<string>,
  ) {}

  onApplicationBootstrap() {
    this.requestInProgressGauge.set(0);
  }
}
