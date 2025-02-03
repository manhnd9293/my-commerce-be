import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../base/entities/abstract-base.entity';
import { ConversationsEntity } from './conversations.entity';

@Entity('messages')
export class MessagesEntity extends AbstractBaseEntity {
  @Column({ name: 'text_content', nullable: false, type: 'varchar' })
  textContent: string;

  @Column({ name: 'conversation_id', nullable: false, type: 'varchar' })
  conversationId: number;

  @ManyToOne(() => ConversationsEntity)
  @JoinColumn({
    name: 'conversation_id',
    referencedColumnName: 'id',
  })
  conversation: ConversationsEntity;
}
