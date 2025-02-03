import { Global, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { OrderItemEntity } from '../orders/entities/order-item.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { UserAddressEntity } from './entity/user-address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrderItemEntity,
      OrderEntity,
      UserAddressEntity,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
@Global()
export class UsersModule {}
