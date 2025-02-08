import { Module } from '@nestjs/common';
import { ProductRatingService } from './product-rating.service';
import { ProductRatingController } from './product-rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../orders/entities/order.entity';
import { OrderItemEntity } from '../orders/entities/order-item.entity';
import { CartItemEntity } from '../carts/entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductRatingEntity } from './entities/product-rating.entity';
import { ProductRatingMediaEntity } from './entities/product-rating-media.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      CartItemEntity,
      ProductVariant,
      ProductRatingEntity,
      ProductRatingMediaEntity,
      Product,
    ]),
  ],
  providers: [ProductRatingService],
  controllers: [ProductRatingController],
})
export class ProductRatingModule {}
