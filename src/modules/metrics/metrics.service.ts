import { Injectable } from '@nestjs/common';
import { Counter, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestCounter;
  constructor() {
    register.clear();
    register.setDefaultLabels({
      app: 'My-commerce-be',
    });

    this.httpRequestCounter = new Counter({
      name: 'http_request_counter',
      help: 'Total number of request to server',
    });
    register.registerMetric(this.httpRequestCounter);
  }

  incrementRequestCounter() {
    this.httpRequestCounter.inc();
  }
}
