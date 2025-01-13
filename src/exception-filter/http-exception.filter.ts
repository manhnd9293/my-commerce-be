import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { MonitorMetrics } from '../utils/enums/monitorMetrics';
import { Counter, Gauge } from 'prom-client';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Http Error');
  constructor(
    @InjectMetric(MonitorMetrics.RequestErrorTotal)
    private readonly requestErrorCounter: Counter<string>,
    @InjectMetric(MonitorMetrics.RequestInProgress)
    private readonly requestInProgressGauge: Gauge<string>,
  ) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const labels = {
      path: request.route?.path,
      method: request.method,
      status,
    };
    this.logger.log(
      `Request Fail: method: ${request.method} path: ${request.originalUrl} status: ${status}`,
    );
    this.requestErrorCounter.inc(labels);
    this.requestInProgressGauge.dec({
      path: request.route?.path,
      method: request.method,
    });
    response.status(status).send(exception);
  }
}
