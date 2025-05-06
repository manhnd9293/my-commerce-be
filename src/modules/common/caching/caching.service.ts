import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CachingService {
  public readonly cacheDb: Redis;
  private readonly logger = new Logger(CachingService.name);
  constructor(private readonly configService: ConfigService) {
    this.cacheDb = new Redis({
      port: configService.get('redis.port'),
      host: configService.get('redis.host'),
      username: configService.get('redis.username'),
      password: configService.get('redis.password'),
    });
    this.cacheDb.on('connect', () => {
      this.logger.log('Connect to redis db success');
    });

    this.cacheDb.on('error', () => {
      this.logger.error('Fail to connect to cached server');
    });
  }
}
