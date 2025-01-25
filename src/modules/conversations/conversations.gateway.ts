import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConversationService } from './conversation.service';
import { JwtPayload } from '../auth/jwt.strategy';
import { ConversationEvent } from './enum/conversation-event';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserRole } from '../../utils/enums/user-role';
import { OnEvent } from '@nestjs/event-emitter';
import { UpdateConversationPayloadDto } from './dto/update-conversation-payload.dto';
import { ConversationStatus } from './enum/conversation-status';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'https://ecommerce.manhnd.men'],
    credentials: true,
  },
})
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ConversationsGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly conversationService: ConversationService,
  ) {}

  async handleConnection(client: Socket, ...args: any[]) {
    const accessToken = client.handshake.auth['Authorization'];
    this.logger.log(`Connected a client ${client.id} - atk: ${accessToken}`);
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.configService.get('jwt.secret'),
        },
      );
      const userSocketEntity =
        await this.conversationService.saveUserSocketData(
          payload.sub,
          client.id,
        );
      this.logger.log(`save user: ${payload.sub} with socket ${client.id}`);
      const userEntity = await this.conversationService.getUserDetail(
        payload.sub,
      );
      if (userEntity.role === UserRole.Admin) {
        this.logger.log(`agent with socket ${client.id} connected`);
        const conversations = await this.conversationService.getConversations({
          status: ConversationStatus.OnGoing,
        });
        this.logger.debug(`agent ${userEntity.id} join room conversations`);
        client.join(conversations.map((c) => '' + c.id));
      }
    } catch (e) {
      client.disconnect(true);
      throw new UnauthorizedException(`Invalid access token: ${accessToken}`);
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Disconnect client ${client.id}`);
    await this.conversationService.deleteUserSocket(client.id);
  }

  @SubscribeMessage(ConversationEvent.EnterConversation)
  handleNewConversation(socket: Socket, conversationId: string) {
    this.logger.log(
      `socket: ${socket.id} join conversation: ${conversationId}`,
    );
    socket.join(conversationId);
  }

  @SubscribeMessage(ConversationEvent.CreateMessage)
  async handleNewMessage(socket: Socket, createMessageDto: CreateMessageDto) {
    const user = await this.conversationService.getUserBySocketId(socket.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const messagesEntity = await this.conversationService.createMessage(
      user.id,
      createMessageDto,
    );
    this.logger.debug(
      `Create message: ${createMessageDto.textContent} by user:${user.id}`,
    );
    socket
      .to('' + createMessageDto.conversationId)
      .emit(ConversationEvent.NewMessage, messagesEntity);

    return messagesEntity;
  }

  @OnEvent(ConversationEvent.Update, { async: true })
  handleUpdateConversationStatus(payload: UpdateConversationPayloadDto) {
    this.server
      .to('' + payload.data.id)
      .emit(ConversationEvent.Update, payload);
  }
}
