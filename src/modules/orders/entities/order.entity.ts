import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from '../../users/entity/user.entity';
import { OrderItemEntity } from './order-item.entity';
import { IsString, MaxLength } from 'class-validator';

@Entity('orders')
export class OrderEntity extends AbstractBaseEntity {
  @Column({ name: 'user_id', type: 'int', nullable: true })
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

  @IsString()
  @MaxLength(100)
  @Column({ name: 'customer_name', type: 'varchar', nullable: true })
  customerName: string;

  @IsString()
  @MaxLength(11, { message: 'phone number is 11 character max' })
  @Column({ name: 'phone', type: 'varchar', nullable: true })
  phone: string;

  @Column({ name: 'province', type: 'varchar', nullable: true })
  @IsString()
  @MaxLength(50)
  province: string;

  @Column({ name: 'district', type: 'varchar', nullable: true })
  @IsString()
  @MaxLength(50)
  district: string;

  @Column({ name: 'commune', type: 'varchar', nullable: true })
  @IsString()
  @MaxLength(50)
  commune: string;

  @Column({ name: 'no_and_street', type: 'varchar', nullable: true })
  @IsString()
  @MaxLength(200)
  noAndStreet: string;
}
