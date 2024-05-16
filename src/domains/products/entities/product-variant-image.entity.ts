import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Asset } from '../../common/entities/asset.entity';

@Entity('product_variant_images')
export class ProductVariantImage extends AbstractBaseEntity {
  @Column({ name: 'asset_id', type: 'bigint' })
  assetId: number;

  @ManyToOne(() => Asset)
  @JoinColumn({
    name: 'asset_id',
    referencedColumnName: 'id',
  })
  asset: Asset;
}
