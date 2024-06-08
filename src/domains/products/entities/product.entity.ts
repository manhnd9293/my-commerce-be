import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { ProductSize } from './product-size.entity';
import { Category } from '../../categories/entities/category.entity';
import { ProductColor } from './product-color.entity';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';

@Entity('products')
export class Product extends AbstractBaseEntity {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @IsString()
  @MaxLength(50000)
  @IsOptional()
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @OneToMany(() => ProductSize, (ps) => ps.product, {
    orphanedRowAction: 'disable',
    cascade: false,
  })
  productSizes?: ProductSize[];

  @OneToMany(() => ProductColor, (pc) => pc.product, {
    orphanedRowAction: 'disable',
    cascade: false,
  })
  productColors?: ProductColor[];

  @OneToMany(() => ProductVariant, (pv) => pv.product, {
    orphanedRowAction: 'disable',
    cascade: false,
  })
  productVariants?: ProductVariant[];

  @IsNotEmpty()
  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: Category;

  @OneToMany(() => ProductImage, (pi) => pi.product, {
    orphanedRowAction: 'disable',
    cascade: false,
  })
  productImages: ProductImage[];
}
