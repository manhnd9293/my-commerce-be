import { CreateOrderItemDto } from './create-order-item.dto';
import { PickType } from '@nestjs/swagger';
import { OrderEntity } from '../entities/order.entity';

export class CreateOrderDto extends PickType(OrderEntity, [
  'customerName',
  'phone',
  'province',
  'district',
  'commune',
  'noAndStreet',
] as const) {
  orderItems: CreateOrderItemDto[];
}
