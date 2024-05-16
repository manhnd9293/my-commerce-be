import { Injectable } from '@nestjs/common';
import { FileStorageService } from './domains/common/file-storage.service';
import { StorageTopLevelFolder } from './enums/storage-to-level-folder';

@Injectable()
export class AppService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async testUploadFile(files: Array<Express.Multer.File>) {
    for (let file of files) {
      await this.fileStorageService.saveFile(
        file,
        StorageTopLevelFolder.Others,
        file.originalname,
      );
    }

    return 'done';
  }

  async getPresignUrl(assetId: number) {
    return this.fileStorageService.createPresignedUrl(assetId);
  }

  async deleteAsset(assetId: number) {
    await this.fileStorageService.deleteAsset(assetId);
    return 'Delete file success';
  }
}
