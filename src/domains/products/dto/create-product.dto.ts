import { CreateProductSizeDto } from './create-product-size.dto';
import { CreateProductColorDto } from './create-product-color.dto';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

export class CreateProductDto extends PickType(Product, [
  'name',
  'description',
  'categoryId',
] as const) {
  @ApiProperty({
    isArray: true,
    type: CreateProductSizeDto,
  })
  productSizes: CreateProductSizeDto[];

  @ApiProperty({
    isArray: true,
    type: CreateProductColorDto,
  })
  productColors: CreateProductColorDto[];
}
