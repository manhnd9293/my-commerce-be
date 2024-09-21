import { PickType } from '@nestjs/swagger';
import { OrderItemEntity } from '../entities/order-item.entity';
import { IsOptional } from 'class-validator';

export class CreateOrderItemDto extends PickType(OrderItemEntity, [
  'productVariantId',
  'quantity',
  'unitPrice',
] as const) {
  @IsOptional()
  cartItemId: number;
}
