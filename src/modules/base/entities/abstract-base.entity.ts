import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entity/user.entity';

export abstract class AbstractBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date;

  @Column({ name: 'created_by_id', type: 'varchar', nullable: true })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'varchar', nullable: true })
  updatedById: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'created_by_id',
    referencedColumnName: 'id',
  })
  createdByUser: UserEntity;
  //
  // @ManyToOne(() => UserEntity)
  // @JoinColumn({
  //   name: 'updated_by_id',
  //   referencedColumnName: 'id',
  // })
  // updatedByUser: UserEntity;
}
