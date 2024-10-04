import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CartItemEntity } from '../../carts/entities/cart-item.entity';
import { OrderEntity } from '../../orders/entities/order.entity';
import { UserRole } from '../../../utils/enums/user-role';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password', type: 'text', select: false })
  password: string;

  @OneToMany(() => CartItemEntity, (ci) => ci.user)
  cart: CartItemEntity[];

  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Buyer,
    name: 'role',
  })
  userRole: UserRole;
}
