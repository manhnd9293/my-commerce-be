import { PickType } from '@nestjs/swagger';
import { ProductSize } from '../entities/product-size.entity';

export class UpdateProductSizeDto extends PickType(ProductSize, [
  'name',
] as const) {
  id?: string | null;
}
