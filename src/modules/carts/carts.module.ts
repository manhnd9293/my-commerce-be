import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { CartItemEntity } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductColor } from '../products/entities/product-color.entity';
import { ProductSize } from '../products/entities/product-size.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CartItemEntity,
      Product,
      ProductVariant,
      ProductColor,
      ProductSize,
    ]),
  ],
  controllers: [CartsController],
  providers: [CartsService],
})
export class CartsModule {}
