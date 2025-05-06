import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Brackets, Repository } from 'typeorm';
import { ConversationsEntity } from './entities/conversations.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAuth } from '../auth/strategies/jwt.strategy';
import { ConversationStatus } from './enum/conversation-status';
import { MessagesEntity } from './entities/messages.entity';
import { Transactional } from 'typeorm-transactional';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserSocketEntity } from './entities/user-socket.entity';

import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';
import { QueryConversationDto } from './dto/query-conversation.dto';
import { FileStorageService } from '../common/file-storage/file-storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationEvent } from './enum/conversation-event';
import { ConversationAction } from './enum/conversation-action';
import { UpdateConversationPayloadDto } from './dto/update-conversation-payload.dto';
import { UserEntity } from '../users/entity/user.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationsEntity)
    private readonly conversationsRepository: Repository<ConversationsEntity>,
    @InjectRepository(MessagesEntity)
    private readonly messagesRepository: Repository<MessagesEntity>,
    @InjectRepository(UserSocketEntity)
    private readonly userSocketRepository: Repository<UserSocketEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly fileStorageService: FileStorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Transactional()
  async createConversation(
    createConversationDto: CreateConversationDto,
    user: UserAuth,
  ) {
    const conversationsEntity = this.conversationsRepository.create({
      createdById: user.userId,
      status: ConversationStatus.Pending,
      subject: createConversationDto.subject,
    });
    const savedConversation =
      await this.conversationsRepository.save(conversationsEntity);

    const messagesEntity = this.messagesRepository.create({
      conversationId: savedConversation.id,
      textContent: createConversationDto.message,
      createdById: user.userId,
    });
    await this.messagesRepository.save(messagesEntity);

    return savedConversation;
  }

  async createMessage(userId: string, createMessageDto: CreateMessageDto) {
    const messagesEntity = this.messagesRepository.create({
      createdById: userId,
      textContent: createMessageDto.textContent,
      conversationId: createMessageDto.conversationId,
    });
    const savedMessage = await this.messagesRepository.save(messagesEntity);

    return savedMessage;
  }

  async saveUserSocketData(userId: string, socketId: string) {
    const userSocketEntity = this.userSocketRepository.create({
      userId,
      socketId,
    });
    const saved = await this.userSocketRepository.save(userSocketEntity);
    return saved;
  }

  async getUserBySocketId(socketId: string) {
    const userSocket = await this.userSocketRepository.findOne({
      where: {
        socketId,
      },
      relations: {
        user: true,
      },
    });
    if (!userSocket) {
      throw Error('Invalid user or socketId');
    }

    return userSocket.user;
  }

  async getConversations(query: QueryConversationDto) {
    const qb = this.conversationsRepository.createQueryBuilder('c');
    query.status &&
      qb.andWhere(`c.status = :cStatus`, { cStatus: query.status });
    qb.leftJoinAndSelect('c.createdByUser', 'createdByUser');
    qb.addSelect(['createdByUser.id', 'createdByUser.avatarFileId']);
    qb.leftJoinAndSelect('c.takenUser', 'takenUser');
    qb.leftJoinAndSelect(
      'c.messages',
      'message',
      'message.id = (select m.id from messages m where m.conversation_id = c.id and ' +
        'm.created_at = (select max(created_at) from messages me where me.conversation_id = c.id))',
    );
    const conversationsEntities = await qb.getMany();
    await Promise.all(
      conversationsEntities.map(async (con) => {
        const url = await this.fileStorageService.createPresignedUrl(
          con.createdByUser.avatarFileId,
        );
        con.createdByUser.avatarUrl = url;
      }),
    );

    return conversationsEntities;
  }

  deleteUserSocket(socketId: string) {
    return this.userSocketRepository.delete({
      socketId: socketId,
    });
  }

  getConversationMessages(id: string) {
    return this.messagesRepository.find({
      where: {
        conversationId: id,
      },
      order: {
        createdAt: 'asc',
      },
    });
  }

  async getConversationDetail(id: number, user: UserAuth) {
    const qb = this.conversationsRepository.createQueryBuilder('con');
    qb.where(`con.id = :conversationId`, { conversationId: id });
    qb.leftJoinAndSelect('con.takenUser', 'takenUser');
    qb.addSelect(['takenUser.id', 'takenUser.avatarFileId']);
    qb.leftJoinAndSelect('con.createdByUser', 'createdByUser');
    const conversationsEntity = await qb.getOne();
    if (
      conversationsEntity.createdById !== user.userId &&
      conversationsEntity.takenById !== user.userId
    ) {
      throw new ForbiddenException(
        'User not allowed to get conversation information',
      );
    }
    if (conversationsEntity?.takenUser?.avatarFileId) {
      conversationsEntity.takenUser.avatarUrl =
        await this.fileStorageService.createPresignedUrl(
          conversationsEntity.takenUser.avatarFileId,
        );
    }
    return conversationsEntity;
  }

  async updateConversationStatus(
    id: string,
    data: UpdateConversationStatusDto,
    user: UserAuth,
  ) {
    const updateStatus = data.status;
    const conversationsEntity = await this.conversationsRepository.findOne({
      where: {
        id,
      },
    });

    if (!conversationsEntity) {
      throw new NotFoundException('conversation not found');
    }

    if (
      updateStatus === ConversationStatus.OnGoing &&
      conversationsEntity.status !== ConversationStatus.Pending
    ) {
      throw new BadRequestException('Invalid state update');
    }

    conversationsEntity.status = updateStatus;
    conversationsEntity.takenById = user.userId;

    const savedUpdate =
      await this.conversationsRepository.save(conversationsEntity);
    const payload: UpdateConversationPayloadDto = {
      type: this.getUpdateAction(updateStatus),
      data: savedUpdate,
    };
    this.eventEmitter.emit(ConversationEvent.Update, payload);

    return savedUpdate;
  }

  getUpdateAction(updateStatus: ConversationStatus) {
    switch (updateStatus) {
      case ConversationStatus.OnGoing:
        return ConversationAction.Take;
      case ConversationStatus.End:
        return ConversationAction.End;
      default:
        throw new BadRequestException('unsupport conversation status');
    }
  }

  async getCurrentConversation(user: UserAuth) {
    const qb = this.conversationsRepository.createQueryBuilder('con');
    qb.andWhere(`con.createdById = :userId`, { userId: user.userId });
    qb.andWhere(
      new Brackets((qb) => {
        qb.where(`con.status = :pendingStatus`, {
          pendingStatus: ConversationStatus.Pending,
        }).orWhere(`con.status = :onGoingStatus`, {
          onGoingStatus: ConversationStatus.OnGoing,
        });
      }),
    );
    qb.leftJoinAndSelect('con.takenUser', 'takenUser');
    qb.addSelect(['takenUser.id', 'takenUser.avatarFileId']);
    qb.orderBy('con.createdAt', 'DESC');
    qb.take(1);
    const conversationsEntity = await qb.getOne();
    if (conversationsEntity?.takenUser?.avatarFileId) {
      conversationsEntity.takenUser.avatarUrl =
        await this.fileStorageService.createPresignedUrl(
          conversationsEntity.takenUser.avatarFileId,
        );
    }

    return conversationsEntity;
  }

  async getUserDetail(userId: string) {
    return this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
  }
}
