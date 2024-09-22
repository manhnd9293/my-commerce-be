import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItemEntity } from './entities/cart-item.entity';
import { Repository } from 'typeorm';
import { CartItemDto } from './dtos/cart-item.dto';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { UserAuth } from '../auth/jwt.strategy';
import { FileStorageService } from '../common/file-storage.service';
import { CartCheckOutUpdateDto } from '../orders/dto/cart-check-out-update.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    private readonly fileStorageService: FileStorageService,
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
        isCheckedOut: true,
      });
    }
    cartItemEntity.quantity += cartItem.quantity;

    const savedCartItem = await this.cartItemRepository.save(cartItemEntity);
    const cartItemFull = await this.cartItemRepository.findOne({
      where: {
        id: savedCartItem.id,
      },
      relations: {
        productVariant: {
          product: {
            productImages: true,
          },
          productSize: true,
          productColor: true,
        },
      },
    });
    cartItemFull.productVariant.product.thumbnailUrl =
      await this.fileStorageService.createPresignedUrl(
        cartItemFull.productVariant.product.productImages[0].assetId,
      );
    return cartItemFull;
  }

  async removeCartItem(cartItemId: number, user: UserAuth) {
    const cartItemEntity = await this.cartItemRepository.findOne({
      where: {
        id: cartItemId,
      },
    });
    if (!cartItemEntity) {
      throw new BadRequestException('Cart item not found');
    }

    if (cartItemEntity.userId !== user.userId) {
      throw new ForbiddenException('Invalid user of cart item');
    }

    await this.cartItemRepository.delete({
      id: cartItemId,
    });

    return 'success';
  }

  async handleChangeCheckOut(checkout: CartCheckOutUpdateDto, user: UserAuth) {
    const { cartItemId, isCheckedOut } = checkout;
    const cartItemEntity = await this.cartItemRepository.findOne({
      where: {
        id: cartItemId,
        userId: user.userId,
      },
    });
    if (!cartItemEntity) {
      throw new BadRequestException('Cart item not found');
    }
    await this.cartItemRepository.update(
      {
        id: cartItemId,
      },
      {
        isCheckedOut,
      },
    );

    return this.cartItemRepository.findOne({
      where: {
        id: cartItemId,
      },
    });
  }
}
