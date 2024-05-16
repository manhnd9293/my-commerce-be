import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Asset } from '../../common/entities/asset.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_variant_images')
export class ProductVariantImage extends AbstractBaseEntity {
  @Column({ name: 'asset_id', type: 'bigint' })
  assetId: number;

  @Column({ name: 'product_variant_id', type: 'bigint' })
  productVariantId: number;

  @ManyToOne(() => Asset)
  @JoinColumn({
    name: 'asset_id',
    referencedColumnName: 'id',
  })
  asset: Asset;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({
    name: 'product_variant_id',
    referencedColumnName: 'id',
  })
  productVariant: ProductVariant;
}
