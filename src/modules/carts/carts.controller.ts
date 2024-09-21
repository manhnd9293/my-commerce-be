import { Body, Controller, Delete, Param, Put } from '@nestjs/common';
import { User } from '../../decorators/user.decorator';
import { CartItemDto } from './dtos/cart-item.dto';
import { CartsService } from './carts.service';
import { UserAuth } from '../auth/jwt.strategy';
import { ApiTags } from '@nestjs/swagger';

@Controller('carts')
@ApiTags('Cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}
  @Put('add')
  addItemToCart(@User() user: UserAuth, @Body() body: CartItemDto) {
    return this.cartsService.addItemToCart(body, user);
  }

  @Delete('item/:id')
  deleteCartItem(@Param('id') id: string, @User() user: UserAuth) {
    return this.cartsService.removeCartItem(+id, user);
  }
}
