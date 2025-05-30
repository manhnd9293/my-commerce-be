import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../../users/entity/user.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('cart_items')
export class CartItemEntity extends AbstractBaseEntity {
  @Column({ name: 'user_id', type: 'number', nullable: false })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user: UserEntity;

  @Column({ name: 'product_variant_id', type: 'number', nullable: false })
  productVariantId: string;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({
    name: 'product_variant_id',
    referencedColumnName: 'id',
  })
  productVariant: ProductVariant;

  @Column({ name: 'quantity', type: 'int', nullable: false })
  quantity: number;

  @Column({ name: 'is_checked_out', type: 'boolean', default: true })
  isCheckedOut: boolean;
}
