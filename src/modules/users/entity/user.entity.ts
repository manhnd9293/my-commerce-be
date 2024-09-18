import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CartItemEntity } from '../../carts/entities/cart-item.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password', type: 'text' })
  password: string;

  @OneToMany(() => CartItemEntity, (ci) => ci.user)
  cart: CartItemEntity[];
}
