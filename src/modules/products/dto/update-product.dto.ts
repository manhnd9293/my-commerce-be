import { ApiProperty, PickType } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { UpdateProductVariantDto } from './update-product-variant.dto';

export class UpdateProductDto extends PickType(Product, [
  'name',
  'description',
  'categoryId',
  'productImages',
  'price',
] as const) {
  @ApiProperty({
    isArray: true,
    type: UpdateProductVariantDto,
  })
  productVariants: UpdateProductVariantDto[];
}
