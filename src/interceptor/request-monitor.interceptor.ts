import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Counter } from 'prom-client';
import { MonitorMetrics } from '../utils/enums/monitorMetrics';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class RequestMonitorInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric(MonitorMetrics.TotalHttpRequest)
    private readonly requestCounter: Counter<string>,
  ) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    this.requestCounter.inc({
      method: request.method,
      path: request.route.path,
    });
    return next.handle();
  }
}
