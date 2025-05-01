import {
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../utils/enums/user-role';
import { User } from '../../decorators/user.decorator';
import { UserAuth } from '../auth/jwt.strategy';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @Roles([UserRole.Admin])
  uploadMedia(
    @User() user: UserAuth,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.mediaService.uploadAssets(files, user);
  }

  @Get()
  @Roles([UserRole.Admin])
  getAssets() {
    return this.mediaService.getAssets();
  }
}
