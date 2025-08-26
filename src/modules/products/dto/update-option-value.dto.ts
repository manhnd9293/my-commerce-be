import { PickType } from '@nestjs/swagger';
import { ProductOptionValueEntity } from '../entities/product-option-value.entity';

export class UpdateOptionValueDto extends PickType(ProductOptionValueEntity, [
  'id',
  'name',
  'position',
] as const) {}
