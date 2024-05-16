import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Product } from './product.entity';

@Entity('product_colors')
export class ProductColor extends AbstractBaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 50 })
  name: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @Column({ name: 'code', type: 'varchar', length: 10 })
  code: string;
}
