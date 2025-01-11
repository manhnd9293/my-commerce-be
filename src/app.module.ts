import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './config/database.config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { CategoriesModule } from './modules/categories/categories.module';
import { CommonModule } from './modules/common/common.module';
import { ProductsModule } from './modules/products/products.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CartsModule } from './modules/carts/carts.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RoleGuard } from './guards/role.guard';
import { HealthModule } from './modules/health/health.module';
import { TerminusModule } from '@nestjs/terminus';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import * as process from 'node:process';
import {
  makeCounterProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { RequestMonitorInterceptor } from './interceptor/request-monitor.interceptor';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('No database option passed');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('throttle.ttl'),
          limit: config.get('throttle.limit'),
        },
      ],
    }),
    TerminusModule.forRoot({
      errorLogStyle: 'json',
      gracefulShutdownTimeoutMs: 1000,
    }),
    MetricsModule,
    CategoriesModule,
    CommonModule,
    ProductsModule,
    CartsModule,
    OrdersModule,
    HealthModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestMonitorInterceptor,
    },
    ...(process.env.NODE_ENV !== 'local'
      ? [
          {
            provide: APP_FILTER,
            useClass: SentryGlobalFilter,
          },
        ]
      : []),
  ],
})
export class AppModule {}
