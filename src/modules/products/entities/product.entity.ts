import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Category } from '../../categories/entities/category.entity';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { ProductRatingEntity } from '../../product-rating/entities/product-rating.entity';
import { ProductOptionEntity } from './product-option.entity';

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
  @Column({ name: 'description', type: 'text', nullable: true, select: false })
  description: string;

  @OneToMany(() => ProductVariant, (pv) => pv.product, {
    orphanedRowAction: 'disable',
    cascade: false,
  })
  productVariants?: ProductVariant[];

  @IsNotEmpty()
  @Column({ name: 'category_id', type: 'varchar', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: Category;

  @OneToMany(() => ProductImage, (pi) => pi.product, {
    orphanedRowAction: 'disable',
    cascade: false,
  })
  productImages: ProductImage[];

  @Column({ name: 'price', nullable: true, type: 'int' })
  price: number;

  thumbnailUrl: string;

  @OneToMany(() => ProductRatingEntity, (pr) => pr.product)
  ratings: ProductRatingEntity[];

  @OneToMany(() => ProductOptionEntity, (po) => po.product)
  productOptions: ProductOptionEntity[];

  @Column({ name: 'thumbnail_asset_id', type: 'varchar', nullable: true })
  thumbnailAssetId: string;
}
