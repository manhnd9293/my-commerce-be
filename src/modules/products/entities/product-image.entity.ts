import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Product } from './product.entity';
import { Asset } from '../../common/entities/asset.entity';

@Entity('product_images')
export class ProductImage extends AbstractBaseEntity {
  @Column({ name: 'product_id', type: 'bigint' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @OneToOne(() => Asset)
  @JoinColumn({ name: 'asset_id', referencedColumnName: 'id' })
  asset: Asset;

  @Column({ name: 'asset_id', type: 'bigint' })
  assetId: number;
}
