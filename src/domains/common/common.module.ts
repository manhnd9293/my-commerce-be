import { Global, Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { GeneratorService } from './generator.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Asset])],
  providers: [FileStorageService, GeneratorService],
  exports: [FileStorageService],
})
export class CommonModule {}
