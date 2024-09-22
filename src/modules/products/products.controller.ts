import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { User } from '../../decorators/user.decorator';
import { UserAuth } from '../auth/jwt.strategy';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductQueryDto } from './dto/product-query.dto';

@Controller('products')
@ApiTags('Products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('productImages'))
  create(@Body() createProductDto: CreateProductDto, @User() user: UserAuth) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Put()
  update(@Body() updateProductDto: UpdateProductDto, @User() user: UserAuth) {
    return this.productsService.update(updateProductDto, user);
  }

  @Patch(':id/images')
  @UseInterceptors(FilesInterceptor('productImages'))
  @ApiConsumes('multipart/form-data')
  updateImage(
    @Param('id') id: string,
    @UploadedFiles() productImageFiles: Array<Express.Multer.File>,
    @User() user: UserAuth,
  ) {
    return this.productsService.updateImages(+id, productImageFiles, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
