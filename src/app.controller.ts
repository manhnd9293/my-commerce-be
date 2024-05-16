import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller()
@ApiTags('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  healthCheck() {
    return 'ok';
  }

  @Post('/upload')
  @UseInterceptors(FilesInterceptor('files'))
  uploadFile(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          // fileType: new RegExp(/(jpg|png|webp)/),
          fileType: 'jpeg',
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    files: Array<Express.Multer.File>,
  ) {
    return this.appService.testUploadFile(files);
  }

  @Get('/presign-url/:assetId')
  @ApiParam({ name: 'id', type: String })
  getPreSignUrl(@Param() params: { assetId: string }) {
    return this.appService.getPresignUrl(Number(params.assetId));
  }

  @Delete('/asset/:assetId')
  deleteAsset(@Param() params: { assetId: string }) {
    return this.appService.deleteAsset(Number(params.assetId));
  }
}
