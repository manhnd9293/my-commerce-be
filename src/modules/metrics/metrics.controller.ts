import { Controller } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Public } from '../../decorators/public.decorator';

@Controller('metrics')
@Public()
export class MetricsController extends PrometheusController {}
