import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { JWT_STRATEGY } from './jwt.strategy';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { MonitorMetrics } from '../../utils/enums/monitorMetrics';
import { Counter } from 'prom-client';

@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY) {
  constructor(
    private reflector: Reflector,
    @InjectMetric(MonitorMetrics.TotalHttpRequest)
    private readonly requestCounter: Counter<string>,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const canActivate = super.canActivate(context);

    if (!canActivate) {
      const request = context.switchToHttp().getRequest();
      this.requestCounter.inc({
        method: request.method,
        path: request.route.path,
      });
    }

    return canActivate;
  }
}
