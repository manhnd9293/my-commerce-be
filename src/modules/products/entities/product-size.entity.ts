import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Product } from './product.entity';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

@Entity('product_sizes')
export class ProductSize extends AbstractBaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 50 })
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  name: string;

  @Column({ name: 'product_id', type: 'bigint' })
  @IsNumber()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;
}
