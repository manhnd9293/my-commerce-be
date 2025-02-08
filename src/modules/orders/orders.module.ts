import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { CartItemEntity } from '../carts/entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      CartItemEntity,
      ProductVariant,
      Product,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
