import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItemEntity } from './entities/cart-item.entity';
import { Repository } from 'typeorm';
import { CartItemDto } from './dtos/cart-item.dto';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { UserAuth } from '../auth/jwt.strategy';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) {}

  async addItemToCart(cartItem: CartItemDto, user: UserAuth) {
    const productVariant = await this.productVariantRepository.findOne({
      where: {
        id: cartItem.productVariantId,
      },
    });
    if (!productVariant) {
      throw new BadRequestException('Invalid product variant id');
    }

    let cartItemEntity = await this.cartItemRepository.findOne({
      where: {
        productVariantId: cartItem.productVariantId,
        userId: user.userId,
      },
    });

    if (!cartItemEntity) {
      cartItemEntity = this.cartItemRepository.create({
        userId: user.userId,
        productVariantId: cartItem.productVariantId,
        quantity: 0,
      });
    }
    cartItemEntity.quantity += cartItem.quantity;

    return await this.cartItemRepository.save(cartItemEntity);
  }
}
