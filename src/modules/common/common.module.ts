import { Global, Module } from '@nestjs/common';
import { FileStorageService } from './file-storage/file-storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { CachingService } from './caching/caching.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Asset])],
  providers: [FileStorageService, CachingService],
  exports: [FileStorageService, CachingService],
})
export class CommonModule {}
