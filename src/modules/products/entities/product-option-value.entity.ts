import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { ProductOptionEntity } from './product-option.entity';

@Entity('product_option_values')
export class ProductOptionValueEntity extends AbstractBaseEntity {
  @Column({ name: 'name', type: 'varchar', nullable: false })
  name: string;

  @Column({ name: 'product_option_id', type: 'varchar', nullable: false })
  productOptionId: string;

  @ManyToOne(() => ProductOptionEntity)
  @JoinColumn({
    name: 'product_option_id',
    referencedColumnName: 'id',
  })
  productOption: ProductOptionEntity;
}
