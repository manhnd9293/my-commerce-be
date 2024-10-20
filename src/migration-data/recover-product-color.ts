import { NestFactory } from '@nestjs/core';
import { MigrationDataModule } from './migration-data.module';
import { MigrationDataService } from './migration-data.service';
import * as process from 'node:process';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function main() {
  initializeTransactionalContext();
  const app = await NestFactory.create(MigrationDataModule);
  const migrationDataService = app.get(MigrationDataService);
  await migrationDataService.recoverProductColor();
  await app.close();
  process.exit(0);
}

main();
