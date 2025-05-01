import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from '../common/entities/asset.entity';
import { Repository } from 'typeorm';
import { UserAuth } from '../auth/jwt.strategy';
import { FileStorageService } from '../common/file-storage.service';
import { StorageTopLevelFolder } from '../../utils/enums/storage-to-level-folder';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async uploadAssets(files: Array<Express.Multer.File>, user: UserAuth) {
    const assets = await Promise.all(
      files.map(async (file) => {
        const asset = await this.fileStorageService.saveFile(
          file,
          StorageTopLevelFolder.Products,
          `${uuidv4()}.${file.mimetype}`,
        );
        return asset;
      }),
    );

    return assets;
  }

  async getAssets() {
    const assets = await this.assetRepository.find({});
    return Promise.all(
      assets.map(async (asset) => {
        const url = await this.fileStorageService.createPresignedUrl(asset.id);
        asset.preSignUrl = url;
        return asset;
      }),
    );
  }
}
