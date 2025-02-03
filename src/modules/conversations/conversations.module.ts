import { Module } from '@nestjs/common';
import { ConversationsGateway } from './conversations.gateway';
import { ConversationService } from './conversation.service';
import { ConversationsController } from './conversations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsEntity } from './entities/conversations.entity';
import { MessagesEntity } from './entities/messages.entity';
import { UserSocketEntity } from './entities/user-socket.entity';
import { UserEntity } from '../users/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationsEntity,
      MessagesEntity,
      UserSocketEntity,
      UserEntity,
    ]),
  ],
  providers: [ConversationsGateway, ConversationService],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
