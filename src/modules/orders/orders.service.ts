import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { In, Repository } from 'typeorm';
import { OrderItemEntity } from './entities/order-item.entity';
import { CartItemEntity } from '../carts/entities/cart-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Transactional } from 'typeorm-transactional';
import { UserAuth } from '../auth/jwt.strategy';
import { ProductVariant } from '../products/entities/product-variant.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) {}

  @Transactional()
  async createOrder(data: CreateOrderDto, user: UserAuth) {
    const { orderItems } = data;
    const deleteCartItemIds = [];
    for (const orderItem of orderItems) {
      const cartItemId = orderItem.cartItemId;
      if (cartItemId) {
        const cartItemEntity = await this.cartItemRepository.findOne({
          where: {
            id: cartItemId,
            userId: user.userId,
          },
        });
        if (!cartItemEntity) {
          throw new BadRequestException('Invalid cart item');
        }
        deleteCartItemIds.push(cartItemId);
      }
    }

    await this.cartItemRepository.softDelete({
      id: In(deleteCartItemIds),
    });

    const productVariantIds = new Set();
    const productVariantIdToQuantity = new Map();
    for (const orderItem of orderItems) {
      const productVariantId = orderItem.productVariantId;
      if (productVariantIds.has(productVariantId)) {
        throw new BadRequestException('Duplicate products');
      }
      productVariantIds.add(productVariantId);
      productVariantIdToQuantity.set(productVariantId, orderItem.quantity);
    }

    const productVariants = await this.productVariantRepository.find({
      where: {
        id: In(Array.from(productVariantIds)),
      },
      relations: {
        product: true,
      },
    });
    if (productVariants.some((pv) => !pv.product)) {
      throw new BadRequestException(
        'Product variant does not have corresponding product',
      );
    }

    if (productVariants.length < productVariantIds.size) {
      throw new BadRequestException('Some product not exist');
    }

    const totalOrderValue = productVariants.reduce((total, item) => {
      total += item.product.price * productVariantIdToQuantity.get(item.id);
      return total;
    }, 0);

    const orderEntity = this.orderRepository.create({
      userId: user.userId,
      total: totalOrderValue,
    });

    const savedOrder = await this.orderRepository.save(orderEntity);

    const orderItemEntities = orderItems.map((item) =>
      this.orderItemRepository.create({ ...item, orderId: savedOrder.id }),
    );

    await this.orderItemRepository.save(orderItemEntities);

    return this.orderRepository.findOne({
      where: {
        id: savedOrder.id,
      },
      relations: {
        user: true,
        orderItems: true,
      },
    });
  }
}
