import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { Column, Entity } from 'typeorm';

@Entity('assets')
export class Asset extends AbstractBaseEntity {
  @Column({ name: 's3_key', type: 'varchar', length: 255 })
  s3Key: string;

  @Column({ name: 'file_type', type: 'varchar', length: 100 })
  fileType: string;

  @Column({ name: 'size', type: 'bigint' })
  size: number;

  url: string;
}
