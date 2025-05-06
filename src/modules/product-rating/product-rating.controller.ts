import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { User } from '../../decorators/user.decorator';
import { UserAuth } from '../auth/strategies/jwt.strategy';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateProductRatingDto } from './dto/create-product-rating.dto';
import { ProductRatingService } from './product-rating.service';
import { ProductRatingQueryDto } from './dto/product-rating-query.dto';
import { Public } from '../../decorators/public.decorator';

@Controller('product-rating')
@ApiTags('product-rating')
export class ProductRatingController {
  constructor(private readonly productRatingService: ProductRatingService) {}

  @Get('pending')
  getPendingRating(@User() user: UserAuth) {
    return this.productRatingService.getPendingRating(user);
  }

  @Public()
  @Get(':productId')
  getProductRating(
    @Param('productId') productId: string,
    @Query() query: ProductRatingQueryDto,
  ) {
    return this.productRatingService.getProductRating(productId, query);
  }

  @Post(':productId')
  @UseInterceptors(FilesInterceptor('productRatingMedia'))
  @ApiConsumes('multipart/form-data')
  rating(
    @Param('productId') productId: string,
    @UploadedFiles() productRatingMedia: Array<Express.Multer.File>,
    @User() user: UserAuth,
    @Body() data: CreateProductRatingDto,
  ) {
    return this.productRatingService.createRating(
      productId,
      data,
      productRatingMedia,
      user,
    );
  }
}
