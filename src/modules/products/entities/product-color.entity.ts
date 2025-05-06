import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Product } from './product.entity';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

@Entity('product_colors')
export class ProductColor extends AbstractBaseEntity {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Column({ name: 'name', type: 'varchar', length: 50 })
  name: string;

  @IsNumber()
  @Column({ name: 'product_id', type: 'varchar' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @Column({ name: 'code', type: 'varchar', length: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;
}
