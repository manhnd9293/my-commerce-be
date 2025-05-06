import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { UserEntity } from './user.entity';

@Entity('user_addresses')
export class UserAddressEntity extends AbstractBaseEntity {
  @Column({ name: 'user_id', nullable: false, type: 'varchar' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.addresses)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user: UserEntity;

  @Column({ name: 'phone', type: 'varchar', nullable: true })
  phone: string;

  @Column({ name: 'province', type: 'varchar', nullable: false })
  province: string;

  @Column({ name: 'district', type: 'varchar', nullable: false })
  district: string;

  @Column({ name: 'commune', type: 'varchar', nullable: false })
  commune: string;

  @Column({ name: 'no_and_street', type: 'varchar', nullable: false })
  noAndStreet: string;

  @Column({ name: 'name', type: 'varchar', nullable: false })
  name: string;
}
