import { IsNotEmpty } from 'class-validator';

export class CartCheckOutUpdateDto {
  @IsNotEmpty()
  cartItemId: number;

  @IsNotEmpty()
  isCheckedOut: boolean;
}
