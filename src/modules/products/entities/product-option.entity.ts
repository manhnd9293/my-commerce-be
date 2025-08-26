import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Product } from './product.entity';
import { ProductOptionValueEntity } from './product-option-value.entity';

@Entity('product_options')
export class ProductOptionEntity extends AbstractBaseEntity {
  @Column({ name: 'name', type: 'varchar', nullable: false })
  name: string;

  @Column({ name: 'product_id', type: 'varchar', nullable: false })
  productId: string;

  @ManyToOne(() => Product, (p) => p.productOptions)
  @JoinColumn({
    name: 'product_id',
    referencedColumnName: 'id',
  })
  product: Product;

  @OneToMany(() => ProductOptionValueEntity, (pov) => pov.productOption)
  optionValues: ProductOptionValueEntity[];

  @Column({ name: 'position', type: 'int', nullable: false })
  position: number;
}
