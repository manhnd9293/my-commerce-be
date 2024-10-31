import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { initializeTransactionalContext } from 'typeorm-transactional';
import helmet from 'helmet';
import './config/sentry/instrument';
import * as process from 'node:process';
async function bootstrap() {
  const logger = new Logger('Main');
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: configService.get('appUrl'),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  const documentConfig = new DocumentBuilder()
    .setTitle('My Commerce API')
    .setDescription('API for My Commerce Application')
    .setVersion(configService.get('version'))
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    swaggerOptions: {
      displayRequestDuration: true,
      persistAuthorization: true,
    },
  });

  app.use(helmet());

  await app.listen(configService.get('port'), () => {
    logger.log(
      `Server is running on port ${process.env.PORT}, in ${process.env.NODE_ENV} env`,
    );
  });
}

bootstrap();
