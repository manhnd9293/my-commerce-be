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
import { UserAuth } from '../auth/strategies/jwt.strategy';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductQueryDto } from './dto/product-query.dto';
import { BaseQueryDto } from '../../utils/common/base-query.dto';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../utils/enums/user-role';

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
  @Roles([UserRole.Admin])
  findAll() {
    return this.productsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Public()
  @Get(':id/similar')
  findSimilarProducts(@Param('id') id: string, @Query() query: BaseQueryDto) {
    return this.productsService.findSimilarProducts(id, query);
  }

  @Put(':id')
  @Roles([UserRole.Admin])
  update(
    @Body() updateProductDto: UpdateProductDto,
    @User() user: UserAuth,
    @Param('id') productId: string,
  ) {
    return this.productsService.update(productId, updateProductDto, user);
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
    return this.productsService.updateImages(id, productImageFiles, user);
  }

  @Patch(':id/media')
  @Roles([UserRole.Admin])
  updateProductMedia(
    @Body() data: { updateIds: string[] },
    @Param('id') productId: string,
    @User() user: UserAuth,
  ) {
    return this.productsService.updateProductMedia(productId, data, user);
  }

  @Delete(':id/media')
  @Roles([UserRole.Admin])
  deleteProductMedia(
    @Body() data: { assetIds: string[] },
    @Param('id') id: string,
  ) {
    return this.productsService.deleteMedia(id, data);
  }

  @Delete(':id')
  @Roles([UserRole.Admin])
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
