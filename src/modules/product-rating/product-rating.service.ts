import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserAuth } from '../auth/jwt.strategy';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { CreateProductRatingDto } from './dto/create-product-rating.dto';
import { StorageTopLevelFolder } from '../../utils/enums/storage-to-level-folder';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from '../orders/entities/order.entity';
import { OrderItemEntity } from '../orders/entities/order-item.entity';
import { CartItemEntity } from '../carts/entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { ProductRatingEntity } from './entities/product-rating.entity';
import { ProductRatingMediaEntity } from './entities/product-rating-media.entity';
import { FileStorageService } from '../common/file-storage.service';
import { ProductRatingQueryDto } from './dto/product-rating-query.dto';
import { PageData } from '../../utils/common/page-data';

@Injectable()
export class ProductRatingService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductRatingEntity)
    private readonly productRatingRepository: Repository<ProductRatingEntity>,
    @InjectRepository(ProductRatingMediaEntity)
    private readonly productRatingMediaRepository: Repository<ProductRatingMediaEntity>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async getPendingRating(user: UserAuth) {
    const qb = this.orderItemRepository.createQueryBuilder('oi');
    qb.leftJoin('oi.productVariant', 'pv');
    qb.leftJoin('oi.order', 'o');
    qb.leftJoin('pv.product', 'p');
    qb.leftJoin('p.ratings', 'r', 'r.userId = :rateUserId', {
      rateUserId: user.userId,
    });
    qb.andWhere('r.id is null');
    qb.andWhere('o.userId = :userId', { userId: user.userId });
    qb.select('distinct p.id');

    const rawIds = await qb.getRawMany<{ id: number }>();
    const productIds = rawIds.map((d) => d.id);
    const products = await this.productRepository.find({
      where: {
        id: In(productIds),
      },
      relations: {
        productImages: true,
      },
    });

    await Promise.all(
      products.map((product) => {
        return this.fileStorageService
          .createPresignedUrl(product.productImages[0].assetId)
          .then((res) => (product.thumbnailUrl = res));
      }),
    );

    return products;
  }

  @Transactional()
  async createRating(
    productId: string,
    data: CreateProductRatingDto,
    productRatingMedia: Array<Express.Multer.File>,
    user: UserAuth,
  ) {
    const userId = user.userId;
    const orderItem = await this.orderItemRepository.findOne({
      where: {
        productVariant: {
          product: {
            id: productId,
          },
        },
        order: {
          userId: userId,
        },
      },

      relations: {
        order: true,
        productVariant: {
          product: true,
        },
      },
    });

    if (!orderItem) {
      throw new ForbiddenException('User not allow to rate this product');
    }
    const doneRating = await this.productRatingRepository.findOne({
      where: {
        productId,
        userId: userId,
      },
    });
    if (doneRating) {
      throw new BadRequestException('User rated this product');
    }
    const productRatingEntity = this.productRatingRepository.create({
      userId: userId,
      productId,
      textContent: data.textContent,
      rate: data.rate,
    });
    await this.productRatingRepository.save(productRatingEntity);

    if (productRatingMedia && productRatingMedia.length > 0) {
      const productRatingMediaEntities = await Promise.all(
        productRatingMedia.map(async (media) => {
          const asset = await this.fileStorageService.saveFile(
            media,
            StorageTopLevelFolder.RatingMedia,
          );
          return this.productRatingMediaRepository.create({
            assetId: asset.id,
            createdById: userId,
            productRatingId: productRatingEntity.id,
          });
        }),
      );
      await this.productRatingMediaRepository.save(productRatingMediaEntities);
    }

    return productRatingEntity;
  }

  async getProductRating(productId: string, query: ProductRatingQueryDto) {
    const qb = this.productRatingRepository.createQueryBuilder('pr');
    qb.andWhere('pr.productId = :pId', { pId: productId });
    query.rate && qb.andWhere('pr.rate = :rate', { rate: query.rate });
    qb.leftJoin('pr.user', 'u');
    qb.leftJoinAndSelect('pr.ratingMedia', 'rm');
    qb.addSelect(['u.email', 'u.fullName', 'u.avatarFileId']);

    const countAll = await qb.getCount();

    qb.skip(query.page ? 0 : query.page - 1);
    qb.take(query.pageSize || 10);
    const ratings = await qb.getMany();

    await Promise.all([
      ...ratings.map((rating) => {
        return Promise.all(
          rating.ratingMedia.map(async (media) => {
            media.mediaUrl = await this.fileStorageService.createPresignedUrl(
              media.assetId,
            );
          }),
        );
      }),
      ...ratings.map(async (rating) => {
        rating.user.avatarUrl =
          await this.fileStorageService.createPresignedUrl(
            rating.user.avatarFileId,
          );
      }),
    ]);

    const pageData: PageData<ProductRatingEntity> = {
      data: ratings,
      page: query.page,
      pageSize: query.pageSize,
      totalPage: Math.ceil(countAll / query.pageSize),
    };
    return pageData;
  }
}
