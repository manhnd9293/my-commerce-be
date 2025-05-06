import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Asset } from '../../common/entities/asset.entity';

@Entity('categories')
export class Category extends AbstractBaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'image_file_id', type: 'varchar', nullable: true })
  imageFileId: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'image_file_id', referencedColumnName: 'id' })
  imageFile: Asset;

  imageFileUrl: string;
}
