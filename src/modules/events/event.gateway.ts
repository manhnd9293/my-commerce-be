import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'https://ecommerce.manhnd.men'],
    credentials: true,
  },
})
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket, ...args: any[]) {
    const accessToken = client.handshake.auth['Authorization'];
    this.logger.log(`Connected a client ${client.id} - atk: ${accessToken}`);
    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.get('jwt.secret'),
      });
    } catch (e) {
      client.disconnect(true);
      throw new UnauthorizedException('Invalid access token');
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Disconnect client ${client.id}`);
  }
}
