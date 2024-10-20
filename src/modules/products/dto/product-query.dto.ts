import { Optional } from '@nestjs/common';

export class ProductQueryDto {
  @Optional()
  categoryId: number;
}
