import { UserEntity } from '../entity/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';
import { FileStorageService } from '../../common/file-storage/file-storage.service';

@Injectable()
@EventSubscriber()
export class UserEntitySubscriber
  implements EntitySubscriberInterface<UserEntity>
{
  private readonly logger = new Logger(UserEntitySubscriber.name);

  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return UserEntity;
  }

  async afterLoad(entity: UserEntity) {
    this.logger.log(`After load entity ${entity.email}`);
    entity.avatarUrl = await this.fileStorageService.createPresignedUrl(
      entity.avatarFileId,
    );
  }
}
