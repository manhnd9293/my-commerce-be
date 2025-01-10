import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import {
  makeCounterProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';

const counterProvider = makeCounterProvider({
  name: 'total_http_request',
  help: 'total number of http request',
});

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
    }),
  ],
  controllers: [MetricsController],
  providers: [counterProvider],
  exports: [counterProvider],
})
export class MetricsModule {}
