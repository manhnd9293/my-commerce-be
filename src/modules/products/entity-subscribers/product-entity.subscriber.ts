import { Injectable, Logger } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';
import { FileStorageService } from '../../common/file-storage/file-storage.service';
import { Product } from '../entities/product.entity';

@Injectable()
@EventSubscriber()
export class ProductEntitySubscriber
  implements EntitySubscriberInterface<Product>
{
  private readonly logger = new Logger(ProductEntitySubscriber.name);

  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Product;
  }

  async afterLoad(entity: Product) {
    this.logger.debug(`Get image for ${entity.name}`);
    entity.thumbnailUrl = entity.thumbnailAssetId
      ? await this.fileStorageService.createPresignedUrl(
          entity.thumbnailAssetId,
        )
      : null;
    this.logger.debug(`Finish get image for ${entity.name}`);
  }
}
