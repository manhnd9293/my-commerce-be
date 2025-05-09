import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { OrderEntity } from './order.entity';
import { IsNotEmpty } from 'class-validator';
import { OrderItemState } from '../../../utils/enums/order-item-state';

@Entity('order_items')
export class OrderItemEntity extends AbstractBaseEntity {
  @IsNotEmpty()
  @Column({ name: 'product_variant_id', type: 'varchar', nullable: false })
  productVariantId: string;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({
    name: 'product_variant_id',
    referencedColumnName: 'id',
  })
  productVariant: ProductVariant;

  @IsNotEmpty()
  @Column({ name: 'quantity', type: 'int', nullable: false })
  quantity: number;

  @IsNotEmpty()
  @Column({ name: 'unit_price', type: 'int', nullable: false })
  unitPrice: number;

  @Column({ name: 'order_id', type: 'varchar', nullable: false })
  @Index()
  orderId: string;

  @ManyToOne(() => OrderEntity, (order) => order.orderItems)
  @JoinColumn({
    name: 'order_id',
    referencedColumnName: 'id',
  })
  order: OrderEntity;

  @Column({
    default: OrderItemState.Preparing,
    enum: OrderItemState,
    type: 'enum',
  })
  state: OrderItemState;
}
