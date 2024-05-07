import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from '../decorators/public.decorator';
import { User } from '../decorators/user.decorator';
import { UserAuth } from '../auth/jwt.strategy';
import { UserEntity } from './entity/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('/')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('/me')
  me(@User() user: UserAuth): Promise<UserEntity> {
    return this.usersService.findByEmail(user.email);
  }
}
