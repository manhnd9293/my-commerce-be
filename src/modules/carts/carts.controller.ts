import { Body, Controller, Put } from '@nestjs/common';
import { User } from '../../decorators/user.decorator';
import { CartItemDto } from './dtos/cart-item.dto';
import { CartsService } from './carts.service';
import { UserAuth } from '../auth/jwt.strategy';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}
  @Put('add')
  addItemToCart(@User() user: UserAuth, @Body() body: CartItemDto) {
    return this.cartsService.addItemToCart(body, user);
  }
}
