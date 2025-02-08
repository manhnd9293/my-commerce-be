import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Asset } from '../../common/entities/asset.entity';
import { ProductRatingEntity } from './product-rating.entity';

@Entity('product_rating_media')
export class ProductRatingMediaEntity extends AbstractBaseEntity {
  @Column({ name: 'asset_id', type: 'int', nullable: false })
  assetId: number;

  @ManyToOne(() => Asset)
  @JoinColumn({
    name: 'asset_id',
    referencedColumnName: 'id',
  })
  asset: Asset;

  @Column({ name: 'product_rating_id', type: 'int', nullable: false })
  productRatingId: number;

  @ManyToOne(() => ProductRatingEntity)
  @JoinColumn({
    name: 'product_rating_id',
    referencedColumnName: 'id',
  })
  productRating: ProductRatingEntity;

  mediaUrl: string;
}
