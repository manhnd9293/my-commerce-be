import { Optional } from '@nestjs/common';
import { BaseQueryDto } from '../../../utils/common/base-query.dto';

export class ProductQueryDto extends BaseQueryDto {
  @Optional()
  categoryId: number;
}
