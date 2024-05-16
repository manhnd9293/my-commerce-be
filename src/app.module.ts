import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './domains/auth/auth.module';
import { UsersModule } from './domains/users/users.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './config/database.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './domains/auth/jwt-auth.guard';
import { CategoriesModule } from './domains/categories/categories.module';
import { CommonModule } from './domains/common/common.module';
import { ProductsModule } from './domains/products/products.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    AuthModule,
    UsersModule,
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
    CategoriesModule,
    CommonModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
