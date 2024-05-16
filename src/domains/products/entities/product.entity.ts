import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { ProductSize } from './product-size.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product extends AbstractBaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @OneToMany(() => ProductSize, (ps) => ps.product, {
    orphanedRowAction: 'disable',
  })
  productSizes: ProductSize[];

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: Category;
}
