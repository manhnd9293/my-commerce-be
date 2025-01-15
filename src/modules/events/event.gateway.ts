import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import * as process from 'node:process';

@WebSocketGateway({
  cors: {
    origin: process.env.APP_URL,
  },
})
export class EventGateway implements OnGatewayConnection {
  private readonly logger = new Logger(EventGateway.name);

  handleConnection(client: any, ...args: any[]) {
    this.logger.log(`Connnected a client`);
  }
}
