import { Global, Module } from '@nestjs/common';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { MonitorController } from './monitor.controller';
import { MonitorMetrics } from '../../utils/enums/monitorMetrics';

const requestCounterProvider = makeCounterProvider({
  name: MonitorMetrics.TotalHttpRequest,
  help: 'total number of http requests',
  labelNames: ['method', 'path'],
});

const requestErrorCounterProvider = makeCounterProvider({
  name: MonitorMetrics.RequestErrorTotal,
  help: 'total number of http requests',
  labelNames: ['method', 'path', 'status'],
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
      defaultMetrics: {
        enabled: true,
      },
      controller: MonitorController,
    }),
  ],
  controllers: [MonitorController],
  providers: [
    requestCounterProvider,
    requestLatencyProvider,
    requestInProgressProvider,
    requestErrorCounterProvider,
  ],
  exports: [
    requestCounterProvider,
    requestLatencyProvider,
    requestInProgressProvider,
    requestErrorCounterProvider,
  ],
})
export class MonitorModule {}
