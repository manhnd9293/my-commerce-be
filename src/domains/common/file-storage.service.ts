import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { Repository } from 'typeorm';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { StorageTopLevelFolder } from '../../utils/enums/storage-to-level-folder';
import { v1 as uuid } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileStorageService {
  private readonly s3: S3;

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly configService: ConfigService,
  ) {
    this.s3 = new S3({
      region: this.configService.get('aws.bucketRegion'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId'),
        secretAccessKey: this.configService.get('aws.secretAccessKey'),
      },
    });
  }

  async saveFile(
    file: Express.Multer.File,
    topLevelFolder: StorageTopLevelFolder = StorageTopLevelFolder.Others,
    fileName: string,
  ) {
    const storageFileName = fileName ? fileName : `${uuid()}.${file.mimetype}`;
    const key = `${topLevelFolder}/${storageFileName}`;
    await this.s3.putObject({
      Bucket: this.configService.get('aws.bucketName'),
      Body: file.buffer,
      ContentType: file.mimetype,
      Key: key,
    });
    const asset = this.assetRepository.create();
    asset.s3Key = key;
    asset.fileType = file.mimetype;
    asset.size = file.size;
    const savedAsset = await this.assetRepository.save(asset);
    return savedAsset;
  }

  async createPresignedUrl(assetId: number) {
    const asset = await this.assetRepository.findOne({
      where: {
        id: assetId,
      },
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    const command = new GetObjectCommand({
      Bucket: this.configService.get('aws.bucketName'),
      Key: asset.s3Key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  async deleteAsset(assetId: number) {
    const asset = await this.assetRepository.findOne({
      where: {
        id: assetId,
      },
    });

    await this.s3.deleteObject({
      Bucket: this.configService.get('aws.bucketName'),
      Key: asset.s3Key,
    });

    await this.assetRepository.delete({
      id: assetId,
    });
  }
}
