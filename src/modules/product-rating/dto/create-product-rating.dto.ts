import { IsString } from 'class-validator';

export class CreateProductRatingDto {
  @IsString()
  textContent: string;

  rate: number;
}
