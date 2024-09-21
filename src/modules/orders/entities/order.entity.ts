import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from '../../users/entity/user.entity';
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
export class OrderEntity extends AbstractBaseEntity {
  @Column({ name: 'user_id', type: 'int', nullable: false })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.orders)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user: UserEntity;

  @Column({ name: 'total', type: 'int', nullable: false })
  total: number;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order)
  orderItems: OrderItemEntity[];
}
