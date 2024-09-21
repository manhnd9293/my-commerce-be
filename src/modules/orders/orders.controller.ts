import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../../decorators/user.decorator';
import { UserAuth } from '../auth/jwt.strategy';

@Controller('orders')
@ApiTags('Orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() data: CreateOrderDto, @User() user: UserAuth) {
    return this.ordersService.createOrder(data, user);
  }
}
