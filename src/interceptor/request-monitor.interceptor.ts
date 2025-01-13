import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Counter, Gauge, Histogram } from 'prom-client';
import { MonitorMetrics } from '../utils/enums/monitorMetrics';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class RequestMonitorInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric(MonitorMetrics.TotalHttpRequest)
    private readonly requestCounter: Counter<string>,
    @InjectMetric(MonitorMetrics.RequestLatencySeconds)
    private readonly requestLatency: Histogram<string>,
    @InjectMetric(MonitorMetrics.RequestInProgress)
    private readonly requestInProgress: Gauge<string>,
  ) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const labels = {
      method: request.method,
      path: request.route.path,
    };
    this.requestCounter.inc(labels);
    this.requestInProgress.inc();
    return next.handle().pipe(
      tap(() =>
        this.requestLatency.observe(labels, (Date.now() - startTime) / 1000),
      ),
      tap(() => {
        this.requestInProgress.dec();
      }),
    );
  }
}
