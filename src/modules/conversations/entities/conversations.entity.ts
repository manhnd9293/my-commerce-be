import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { ConversationStatus } from '../enum/conversation-status';
import { UserEntity } from '../../users/entity/user.entity';
import { MessagesEntity } from './messages.entity';

@Entity('conversations')
export class ConversationsEntity extends AbstractBaseEntity {
  @Column({ name: 'status', enum: ConversationStatus, nullable: false })
  status: ConversationStatus;

  @Column({ name: 'subject', type: 'varchar' })
  subject: string;

  @Column({ name: 'taken_by_id', type: 'int', nullable: true })
  takenById: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'taken_by_id',
    referencedColumnName: 'id',
  })
  takenUser: UserEntity;

  @OneToMany(() => MessagesEntity, (m) => m.conversation)
  messages: MessagesEntity[];
}
