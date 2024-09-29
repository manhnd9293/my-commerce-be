import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../modules/products/entities/product.entity';
import { ProductColor } from '../modules/products/entities/product-color.entity';
import { ProductSize } from '../modules/products/entities/product-size.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { MigrationDataService } from './migration-data.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { DatabaseConfig } from '../config/database.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

@Module({
  imports: [
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
    TypeOrmModule.forFeature([
      Product,
      ProductColor,
      ProductSize,
      ProductVariant,
    ]),
  ],
  providers: [MigrationDataService],
})
export class MigrationDataModule {}
