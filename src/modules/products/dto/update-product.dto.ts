import { ApiProperty, PickType } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { UpdateProductSizeDto } from './update-product-size.dto';
import { UpdateProductColorDto } from './update-product-color.dto';

export class UpdateProductDto extends PickType(Product, [
  'name',
  'description',
  'categoryId',
  'productImages',
  'price',
] as const) {
  @ApiProperty({
    isArray: true,
    type: UpdateProductSizeDto,
  })
  productSizes: UpdateProductSizeDto[];

  @ApiProperty({
    isArray: true,
    type: UpdateProductColorDto,
  })
  productColors: UpdateProductColorDto[];
}
