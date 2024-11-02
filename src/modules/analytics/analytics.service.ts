import { Injectable } from '@nestjs/common';
import {
  DashboardPeriod,
  DashboardQueryDto,
} from './dto/dashboard/dashboard-query.dto';
import {
  DashboardDataDto,
  DataPoint,
  TopSellCategoryData,
  TopSellProductData,
} from './dto/dashboard/dashboard-data.dto';
import { DateTime } from 'luxon';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { In, Repository } from 'typeorm';
import { OrderEntity } from '../orders/entities/order.entity';
import { OrderItemEntity } from '../orders/entities/order-item.entity';
import { UserEntity } from '../users/entity/user.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { FileStorageService } from '../common/file-storage.service';
import { Category } from '../categories/entities/category.entity';

type DetailPeriod = 'MONTH' | 'DAY' | 'DAY OF WEEK' | 'HOUR';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async getDashboardData(query: DashboardQueryDto): Promise<DashboardDataDto> {
    const { period } = query;
    const now = DateTime.now();
    const startTime = now.startOf(period).toJSDate();
    const endTime = now.endOf(period).toJSDate();
    const lastPeriodStartTime = now
      .minus({ [period]: 1 })
      .startOf(period)
      .toJSDate();
    const lastPeriodEndTime = now
      .minus({ [period]: 1 })
      .endOf(period)
      .toJSDate();

    const currentSale = await this.getSaleValue(startTime, endTime);
    const saleLastPeriod = await this.getSaleValue(
      lastPeriodStartTime,
      lastPeriodEndTime,
    );

    const totalCurrentOrder = await this.getNumberOfOrders(startTime, endTime);
    const totalOrderLastPeriod = await this.getNumberOfOrders(
      lastPeriodStartTime,
      lastPeriodEndTime,
    );

    const totalNewCustomer = await this.getNewCustomer(startTime, endTime);
    const totalNewCustomerLastPeriod = await this.getNewCustomer(
      lastPeriodStartTime,
      lastPeriodEndTime,
    );

    const productSold = await this.getProductSold(startTime, endTime);
    const productSoldLastPeriod = await this.getProductSold(
      lastPeriodStartTime,
      lastPeriodEndTime,
    );

    const revenueChart = await this.getSaleDetails(startTime, endTime, period);
    const orderChart = await this.getNumberOrderDetail(
      startTime,
      endTime,
      period,
    );
    const topSellProduct = await this.getTopSellProduct(startTime, endTime, 10);
    const result: DashboardDataDto = {
      totalRevenue: currentSale,
      revenueChange:
        Math.round(((currentSale - saleLastPeriod) / saleLastPeriod) * 100) /
        100,
      totalOrder: totalCurrentOrder,
      orderChange:
        Math.round(
          ((totalCurrentOrder - totalOrderLastPeriod) / totalOrderLastPeriod) *
            100,
        ) / 100,
      newCustomer: totalNewCustomer,
      customerChange:
        Math.round(
          ((totalNewCustomer - totalNewCustomerLastPeriod) /
            totalNewCustomerLastPeriod) *
            100,
        ) / 100,
      productSold,
      productSoldChange:
        Math.round(
          ((productSold - productSoldLastPeriod) / productSoldLastPeriod) * 100,
        ) / 100,
      revenueChart,
      orderChart,
      topSellProduct,
      topSellCategory: await this.getTopSellCategory(startTime, endTime, 10),
      recentSale: [],
    };

    return result;
  }

  private getDetailPeriod(period: DashboardPeriod): DetailPeriod {
    const record: Record<DashboardPeriod, DetailPeriod> = {
      [DashboardPeriod.Month]: 'DAY',
      [DashboardPeriod.Year]: 'MONTH',
      [DashboardPeriod.Day]: 'HOUR',
      [DashboardPeriod.Week]: 'DAY OF WEEK',
    };

    return record[period];
  }

  private async getSaleDetails(
    startTime: Date,
    endTime: Date,
    period: DashboardPeriod,
  ) {
    const detailPeriod = this.getDetailPeriod(period);
    const orderQb = this.orderRepository.createQueryBuilder('order');
    orderQb.andWhere('order.createdAt >= :startTime', { startTime });
    orderQb.andWhere('order.createdAt <= :endTime', { endTime });
    orderQb.groupBy(`EXTRACT(${detailPeriod} from order.createdAt)`);
    orderQb.select(
      `COALESCE(SUM(order.total), 0) as total, EXTRACT(${detailPeriod} from order.createdAt) as time`,
    );
    const result =
      await orderQb.getRawMany<{ total: number; time: number }[]>();

    const chartData: DataPoint[] = [];

    //todo: implement later
    if (detailPeriod !== 'HOUR') {
      return [];
    }

    if (detailPeriod === 'HOUR') {
      for (let i = 0; i < 24; i++) {
        chartData[i] = { xValue: '' + i, yValue: 0 };
      }
    }

    for (const item of result) {
      // @ts-ignore
      chartData[parseInt(item['time'])]['yValue'] = item['total'];
    }

    return chartData;
  }

  private async getSaleValue(startTime: Date, endTime: Date) {
    const orderQb = this.orderRepository.createQueryBuilder('order');
    orderQb.andWhere('order.createdAt >= :startTime', { startTime });
    orderQb.andWhere('order.createdAt <= :endTime', { endTime });
    orderQb.select(`COALESCE(SUM(order.total), 0) as total`);
    const result = await orderQb.getRawOne();

    return parseInt(result['total']);
  }

  private async getNumberOfOrders(startTime: Date, endTime: Date) {
    const orderQb = this.orderRepository.createQueryBuilder('order');
    orderQb.andWhere('order.createdAt >= :startTime', { startTime });
    orderQb.andWhere('order.createdAt <= :endTime', { endTime });
    orderQb.select('COALESCE(COUNT(order.id), 0) as total');
    const result = await orderQb.getRawOne();

    return parseInt(result['total']);
  }

  private async getNumberOrderDetail(
    startTime: Date,
    endTime: Date,
    period: DashboardPeriod,
  ) {
    const detailPeriod = this.getDetailPeriod(period);
    const orderQb = this.orderRepository.createQueryBuilder('order');
    orderQb.andWhere('order.createdAt >= :startTime', { startTime });
    orderQb.andWhere('order.createdAt <= :endTime', { endTime });
    orderQb.groupBy(`EXTRACT(${detailPeriod} from order.createdAt)`);
    orderQb.select(
      `COALESCE(COUNT(order.id), 0) as total, EXTRACT(${detailPeriod} from order.createdAt) as time`,
    );
    const result =
      await orderQb.getRawMany<{ total: number; time: number }[]>();

    const chartData: DataPoint[] = [];

    //todo: implement later
    if (detailPeriod !== 'HOUR') {
      return [];
    }

    if (detailPeriod === 'HOUR') {
      for (let i = 0; i < 24; i++) {
        chartData[i] = { xValue: '' + i, yValue: 0 };
      }
    }

    for (const item of result) {
      // @ts-ignore
      chartData[parseInt(item['time'])]['yValue'] = item['total'];
    }

    return chartData;
  }

  private async getNewCustomer(startTime: Date, endTime: Date) {
    const userQb = this.userRepository.createQueryBuilder('user');
    userQb.andWhere('user.createdAt >= :startTime', { startTime });
    userQb.andWhere('user.createdAt <= :endTime', { endTime });
    userQb.select('COALESCE(COUNT(user.id), 0) as total');
    const result = await userQb.getRawOne();

    return parseInt(result['total']);
  }

  private async getProductSold(startTime: Date, endTime: Date) {
    const orderQb = this.orderRepository.createQueryBuilder('order');
    orderQb.andWhere('order.createdAt >= :startTime', { startTime });
    orderQb.andWhere('order.createdAt <= :endTime', { endTime });
    orderQb.leftJoinAndSelect('order.orderItems', 'orderItem');
    orderQb.select('COALESCE(SUM(orderItem.quantity), 0) as total');
    const result = await orderQb.getRawOne();

    return parseInt(result['total']);
  }

  private async getTopSellProduct(
    startTime: Date,
    endTime: Date,
    take: number,
  ): Promise<TopSellProductData[]> {
    const qb = this.orderItemRepository.createQueryBuilder('orderItems');
    qb.andWhere('orderItems.createdAt >= :startTime', { startTime })
      .andWhere('orderItems.createdAt <= :endTime', { endTime })
      .groupBy('orderItems.productVariantId')
      .select(
        'orderItems.productVariantId pvi, SUM(orderItems.quantity) as sale_quantity, sum(orderItems.quantity * orderItems.unitPrice) as sale_value',
      )
      .orderBy('sale_quantity', 'DESC')
      .take(take);

    const queryResults = await qb.getRawMany();

    const idToProductVariant = new Map();

    const productVariants = await this.productVariantRepository.find({
      where: {
        id: In(queryResults.map((res) => res['pvi'])),
      },
      relations: {
        product: {
          productImages: true,
        },
      },
      order: {
        product: {
          productImages: {
            id: 'ASC',
          },
        },
      },
    });

    for (const pv of productVariants) {
      idToProductVariant.set(pv.id, productVariants);
      pv.product.thumbnailUrl =
        await this.fileStorageService.createPresignedUrl(
          pv.product.productImages[0].assetId,
        );
    }

    return queryResults.map((result) => ({
      productVariant: idToProductVariant.get(result['pvi']),
      saleQuantity: parseInt(result['sale_quantity']),
      saleValue: parseInt(result['sale_value']),
    }));
  }

  private async getTopSellCategory(
    startTime: Date,
    endTime: Date,
    take: number,
  ): Promise<TopSellCategoryData[]> {
    const qb = this.orderItemRepository.createQueryBuilder('orderItems');
    qb.andWhere('orderItems.createdAt >= :startTime', { startTime })
      .andWhere('orderItems.createdAt <= :endTime', { endTime })
      .leftJoin('orderItems.productVariant', 'productVariant')
      .leftJoin('productVariant.product', 'product')
      .groupBy('product.categoryId')
      .select(
        'product.categoryId cid, SUM(orderItems.quantity) as sale_quantity, sum(orderItems.quantity * orderItems.unitPrice) as sale_value',
      )
      .orderBy('sale_quantity', 'DESC')
      .take(take);

    const queryResults = await qb.getRawMany();

    const idToCategory = new Map();

    const categories = await this.categoryRepository.find({
      where: {
        id: In(queryResults.map((res) => res['cid'])),
      },
    });

    for (const cat of categories) {
      idToCategory.set(cat.id, cat);
    }

    return queryResults.map((result) => ({
      category: idToCategory.get(result['cid']),
      saleValue: parseInt(result['sale_value']),
      valueChange: 0,
    }));
  }
}
