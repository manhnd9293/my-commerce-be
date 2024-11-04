import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartItemEntity } from '../../carts/entities/cart-item.entity';
import { OrderEntity } from '../../orders/entities/order.entity';
import { UserRole } from '../../../utils/enums/user-role';
import { Asset } from '../../common/entities/asset.entity';
import { UserAddressEntity } from './user-address.entity';
import {
  IsDate,
  IsDateString,
  IsOptional,
  IsString,
  MaxDate,
  MaxLength,
  MinDate,
  MinLength,
} from 'class-validator';

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
  role: UserRole;

  @Column({
    name: 'avatar_file_id',
    nullable: true,
    type: 'bigint',
    select: false,
  })
  avatarFileId: number;

  @ManyToOne(() => Asset)
  @JoinColumn({
    name: 'avatar_file_id',
    referencedColumnName: 'id',
  })
  avatar: Asset;

  avatarUrl: string;

  @OneToMany(() => UserAddressEntity, (ua) => ua.user)
  addresses: UserAddressEntity[];

  @Column({ name: 'full_name', type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  fullName: string;

  @Column({ name: 'dob', type: 'date', nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  dob: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true, length: 11 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(11)
  phone: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date;
}
