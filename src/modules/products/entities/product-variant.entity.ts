import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant extends AbstractBaseEntity {
  @Column({ name: 'product_id', type: 'varchar' })
  @Index()
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({
    name: 'product_id',
    referencedColumnName: 'id',
  })
  product: Product;

  @Column({ name: 'quantity', type: 'int', default: 0 })
  quantity: number;

  @Column({ name: 'price', type: 'decimal', default: 0 })
  price: number;

  @Column({
    name: 'specs',
    type: 'json',
    nullable: true,
    default: {},
  })
  specs: ProductVariantSpecs;
}

export type SingleSpec = {
  optionId: string;
  optionName: string;
  optionValueId: string;
  optionValueName: string;
};

export type ProductVariantSpecs = SingleSpec[];
