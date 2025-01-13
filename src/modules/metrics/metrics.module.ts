import { Global, Module } from '@nestjs/common';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { MonitorMetrics } from '../../utils/enums/monitorMetrics';

const counterProvider = makeCounterProvider({
  name: MonitorMetrics.TotalHttpRequest,
  help: 'total number of http requests',
  labelNames: ['method', 'path'],
});

const requestLatencyProvider = makeHistogramProvider({
  name: MonitorMetrics.RequestLatencySeconds,
  help: 'latency of http requests',
  labelNames: ['method', 'path'],
});

const requestInProgressProvider = makeGaugeProvider({
  name: MonitorMetrics.RequestInProgress,
  help: 'number of requests in progress',
  labelNames: ['method', 'path'],
});

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
    }),
  ],
  controllers: [MetricsController],
  providers: [
    counterProvider,
    requestLatencyProvider,
    requestInProgressProvider,
  ],
  exports: [counterProvider, requestLatencyProvider, requestInProgressProvider],
})
export class MetricsModule {}
