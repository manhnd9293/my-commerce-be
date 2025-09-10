import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductSize } from './entities/product-size.entity';
import { ProductColor } from './entities/product-color.entity';
import { Asset } from '../common/entities/asset.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductOptionEntity } from './entities/product-option.entity';
import { ProductOptionValueEntity } from './entities/product-option-value.entity';
import { ProductEntitySubscriber } from './entity-subscribers/product-entity.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductSize,
      ProductColor,
      Asset,
      ProductVariant,
      Category,
      ProductImage,
      ProductOptionEntity,
      ProductOptionValueEntity,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductEntitySubscriber],
})
export class ProductsModule {}
