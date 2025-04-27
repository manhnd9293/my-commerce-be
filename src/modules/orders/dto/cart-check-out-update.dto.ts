import { IsNotEmpty } from 'class-validator';

export class CartCheckOutUpdateDto {
  @IsNotEmpty()
  cartItemId: string;

  @IsNotEmpty()
  isCheckedOut: boolean;
}
