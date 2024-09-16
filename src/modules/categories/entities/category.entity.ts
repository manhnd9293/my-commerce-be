import { Column, Entity } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';

@Entity('categories')
export class Category extends AbstractBaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;
}
