import { ApiProperty, PickType } from '@nestjs/swagger';
import { ProductOptionEntity } from '../entities/product-option.entity';
import { UpdateOptionValueDto } from './update-option-value.dto';

export class UpdateProductOptionDto extends PickType(ProductOptionEntity, [
  'id',
  'name',
  'position',
] as const) {
  @ApiProperty({
    isArray: true,
    type: UpdateOptionValueDto,
  })
  optionValues: UpdateOptionValueDto[];
}
