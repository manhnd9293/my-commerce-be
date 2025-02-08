import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ListId } from './dto/list-id.dto';
import { Public } from '../../decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../utils/enums/user-role';
import { User } from '../../decorators/user.decorator';
import { UserAuth } from '../auth/jwt.strategy';

@ApiTags('Categories')
@Controller('categories')
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles([UserRole.Admin])
  @UseInterceptors(FileInterceptor('image', {}))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 30 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: true,
      }),
    )
    image: Express.Multer.File,
    @User() user: UserAuth,
  ) {
    return this.categoriesService.create(createCategoryDto, image, user);
  }

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.categoriesService.findOne(+id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('updateImage', {}))
  @ApiConsumes('multipart/form-data')
  @Roles([UserRole.Admin])
  update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 30 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    updateImage?: Express.Multer.File,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, updateImage);
  }

  @Delete()
  @Roles([UserRole.Admin])
  remove(@Body() data: ListId) {
    return this.categoriesService.remove(data);
  }
}
