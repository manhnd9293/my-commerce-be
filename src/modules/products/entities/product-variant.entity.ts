import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { ProductSize } from './product-size.entity';
import { ProductColor } from './product-color.entity';

@Entity('product_variant')
export class ProductVariant extends AbstractBaseEntity {
  @Column({ name: 'product_id', type: 'bigint' })
  @Index()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({
    name: 'product_id',
    referencedColumnName: 'id',
  })
  product: Product;

  @Column({
    name: 'product_size_id',
    type: 'bigint',
    nullable: true,
  })
  productSizeId: number;

  @ManyToOne(() => ProductSize)
  @JoinColumn({
    name: 'product_size_id',
    referencedColumnName: 'id',
  })
  productSize: ProductSize;

  @Column({
    name: 'product_color_id',
    type: 'bigint',
    nullable: true,
  })
  productColorId: number;

  @ManyToOne(() => ProductColor)
  @JoinColumn({
    name: 'product_color_id',
    referencedColumnName: 'id',
  })
  productColor: ProductColor;

  @Column({ name: 'quantity', type: 'int', default: 0 })
  quantity: number;
}
