export enum DashboardPeriod {
  Day = 'day',
  Month = 'month',
  Year = 'year',
  Week = 'week',
}

export class DashboardQueryDto {
  period: DashboardPeriod;
}
