import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardQueryDto } from './dto/dashboard/dashboard-query.dto';
import { DashboardDataDto } from './dto/dashboard/dashboard-data.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardData(
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardDataDto> {
    return this.analyticsService.getDashboardData(query);
  }
}
