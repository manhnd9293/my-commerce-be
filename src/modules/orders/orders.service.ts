import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { Brackets, In, Repository } from 'typeorm';
import { OrderItemEntity } from './entities/order-item.entity';
import { CartItemEntity } from '../carts/entities/cart-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Transactional } from 'typeorm-transactional';
import { UserAuth } from '../auth/jwt.strategy';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { FileStorageService } from '../common/file-storage.service';
import { OrderQueryDto } from './dto/order-query.dto';
import { PageData } from '../../utils/common/page-data';
import { UserRole } from '../../utils/enums/user-role';

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
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Transactional()
  async createOrder(data: CreateOrderDto, user?: UserAuth) {
    const {
      orderItems,
      customerName,
      phone,
      commune,
      district,
      province,
      noAndStreet,
    } = data;
    if (user) {
      const deleteCartItemIds = [];
      for (const orderItem of orderItems) {
        const cartItemId = orderItem.cartItemId;
        if (cartItemId) {
          const cartItemEntity = await this.cartItemRepository.findOne({
            where: {
              id: cartItemId,
              userId: user ? user.userId : null,
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
    }

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

    //todo: validate delivery address

    const orderEntity = this.orderRepository.create({
      userId: user ? user.userId : null,
      total: totalOrderValue,
      customerName,
      phone,
      province,
      district,
      commune,
      noAndStreet,
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

  async getOrders(query: OrderQueryDto) {
    const { userId, page, pageSize, search, sortBy, order } = query;

    const qb = this.orderRepository.createQueryBuilder('od');
    qb.leftJoinAndSelect('od.orderItems', 'orderItems');
    qb.leftJoinAndSelect('orderItems.productVariant', 'productVariant');
    qb.leftJoinAndSelect('productVariant.product', 'product');
    qb.leftJoinAndSelect('product.productImages', 'productImages');
    qb.leftJoinAndSelect('od.user', 'user');
    userId && qb.andWhere('od.user_id = :userId', { userId });
    search &&
      qb.andWhere(
        new Brackets((sub) => {
          const searchTerm = `%${search}%`;
          sub
            .where(`od.id::text like :orderIdSearch`, {
              orderIdSearch: searchTerm,
            })
            .orWhere(`user.email like :searchEmail`, {
              searchEmail: searchTerm,
            })
            .orWhere('LOWER(product.name) like :searchProductName', {
              searchProductName: searchTerm,
            });
        }),
      );
    const total = await qb.getCount();

    qb.orderBy(`od.${sortBy}`, order);

    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const orderEntities = await qb.getMany();

    const pageData: PageData<OrderEntity> = {
      data: orderEntities,
      page,
      pageSize,
      totalPage: Math.ceil(total / pageSize),
    };

    return pageData;
  }

  async getOrderDetail(id: number, user: UserAuth) {
    const orderEntity = await this.orderRepository.findOne({
      where: {
        id,
      },
      relations: {
        orderItems: {
          productVariant: {
            product: {
              productImages: true,
            },
            productColor: true,
            productSize: true,
          },
        },
      },
    });

    if (!orderEntity) {
      throw new NotFoundException('Order not found');
    }

    if (user.role !== UserRole.Admin && user.userId !== orderEntity.userId) {
      throw new ForbiddenException('Not allow to see order detail');
    }

    for (const item of orderEntity.orderItems) {
      item.productVariant.product.thumbnailUrl =
        await this.fileStorageService.createPresignedUrl(
          item.productVariant.product.productImages[0].assetId,
        );
    }

    return orderEntity;
  }
}
