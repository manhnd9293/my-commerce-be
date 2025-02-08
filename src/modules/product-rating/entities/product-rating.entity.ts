import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../../users/entity/user.entity';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductRatingMediaEntity } from './product-rating-media.entity';

@Entity('product_rating')
export class ProductRatingEntity extends AbstractBaseEntity {
  @Column({ name: 'product_id', type: 'int', nullable: false })
  @Index()
  productId: number;

  @Column({ name: 'user_id', type: 'int', nullable: false })
  @Index()
  userId: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user: UserEntity;

  @ManyToOne(() => Product)
  @JoinColumn({
    name: 'product_id',
    referencedColumnName: 'id',
  })
  product: Product;

  @Column({
    name: 'text_content',
    nullable: false,
    type: 'varchar',
    length: 1024,
  })
  textContent: string;

  @Column({
    name: 'rate',
    type: 'float',
    nullable: false,
  })
  rate: number;

  @OneToMany(() => ProductRatingMediaEntity, (pm) => pm.productRating)
  ratingMedia: ProductRatingMediaEntity[];
}
