import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../../decorators/user.decorator';
import { UserAuth } from '../auth/jwt.strategy';
import { OrderQueryDto } from './dto/order-query.dto';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../utils/enums/user-role';
import { Public } from '../../decorators/public.decorator';

@Controller('orders')
@ApiTags('Orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() data: CreateOrderDto, @User() user: UserAuth) {
    return this.ordersService.createOrder(data, user);
  }

  @Public()
  @Post('no-auth')
  createOrderWithoutAuth(@Body() data: CreateOrderDto) {
    return this.ordersService.createOrder(data);
  }

  @Get('')
  getOrders(@User() user: UserAuth, @Query() query: OrderQueryDto) {
    return this.ordersService.getOrders(query);
  }

  @Get('/my-order')
  getMyOrder(@User() user: UserAuth, @Query() query: OrderQueryDto) {
    if (Number(query.userId) !== user.userId) {
      throw new ForbiddenException('Invalid request');
    }
    return this.ordersService.getOrders(query);
  }

  @Roles([UserRole.Admin, UserRole.Buyer])
  @Get(':id')
  getOrderDetail(@User() user: UserAuth, @Param('id') id: string) {
    return this.ordersService.getOrderDetail(+id, user);
  }
}
