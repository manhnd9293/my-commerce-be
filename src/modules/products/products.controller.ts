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
import { BaseQueryDto } from '../../utils/common/base-query.dto';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../utils/enums/user-role';
import { MetricsService } from '../metrics/metrics.service';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

@Controller('products')
@ApiTags('Products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('productImages'))
  @Roles([UserRole.Admin])
  create(@Body() createProductDto: CreateProductDto, @User() user: UserAuth) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  @Public()
  getProductPage(@Query() query: ProductQueryDto) {
    return this.productsService.findPage(query);
  }
  @Get('/all')
  findAll() {
    return this.productsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Public()
  @Get(':id/similar')
  findSimilarProducts(@Param('id') id: string, @Query() query: BaseQueryDto) {
    return this.productsService.findSimilarProducts(+id, query);
  }

  @Put()
  @Roles([UserRole.Admin])
  update(@Body() updateProductDto: UpdateProductDto, @User() user: UserAuth) {
    return this.productsService.update(updateProductDto, user);
  }

  @Patch(':id/images')
  @UseInterceptors(FilesInterceptor('productImages'))
  @ApiConsumes('multipart/form-data')
  @Roles([UserRole.Admin])
  updateImage(
    @Param('id') id: string,
    @UploadedFiles() productImageFiles: Array<Express.Multer.File>,
    @User() user: UserAuth,
  ) {
    return this.productsService.updateImages(+id, productImageFiles, user);
  }

  @Delete(':id')
  @Roles([UserRole.Admin])
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
