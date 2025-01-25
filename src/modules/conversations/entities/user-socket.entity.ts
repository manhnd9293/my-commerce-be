import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { UserEntity } from '../../users/entity/user.entity';

@Entity('user_sockets')
export class UserSocketEntity extends AbstractBaseEntity {
  @Column({ name: 'socket_id', type: 'varchar', nullable: false })
  socketId: string;

  @Column({ name: 'user_id', type: 'int', nullable: false })
  userId: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user: UserEntity;
}
