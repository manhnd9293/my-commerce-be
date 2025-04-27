import { Body, Controller, Delete, Param, Patch, Put } from '@nestjs/common';
import { User } from '../../decorators/user.decorator';
import { CartItemDto } from './dtos/cart-item.dto';
import { CartsService } from './carts.service';
import { UserAuth } from '../auth/jwt.strategy';
import { ApiTags } from '@nestjs/swagger';
import { CartCheckOutUpdateDto } from '../orders/dto/cart-check-out-update.dto';

@Controller('carts')
@ApiTags('Cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}
  @Put('add')
  addItemToCart(@User() user: UserAuth, @Body() body: CartItemDto) {
    return this.cartsService.addItemToCart(body, user);
  }

  @Patch('/item/check-out')
  handleChangeCheckOut(
    @User() user: UserAuth,
    @Body() cartItemCheckOutUpdate: CartCheckOutUpdateDto,
  ) {
    return this.cartsService.handleChangeCheckOut(cartItemCheckOutUpdate, user);
  }

  @Delete('item/:id')
  deleteCartItem(@Param('id') id: string, @User() user: UserAuth) {
    return this.cartsService.removeCartItem(id, user);
  }
}
