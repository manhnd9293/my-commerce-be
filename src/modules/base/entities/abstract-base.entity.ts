import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class AbstractBaseEntity {
  @PrimaryColumn({ generated: 'increment' })
  id: number;

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

  @Column({ name: 'created_by_id', type: 'bigint', nullable: true })
  createdById: number;

  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true })
  updatedById: number;

  // @ManyToOne(() => UserEntity)
  // @JoinColumn({
  //   name: 'created_by_id',
  //   referencedColumnName: 'id',
  // })
  // createdByUser: UserEntity;
  //
  // @ManyToOne(() => UserEntity)
  // @JoinColumn({
  //   name: 'updated_by_id',
  //   referencedColumnName: 'id',
  // })
  // updatedByUser: UserEntity;
}
